/**
 * SDS Demo Publisher API Route
 *
 * This demonstrates the CORRECT way to publish to Somnia Data Streams.
 * In production, this would be a backend service with:
 * - Private key wallet
 * - Continuous block monitoring
 * - Automatic data publishing via setAndEmitEvents()
 *
 * NOTE: This is a READ-ONLY demo showing the pattern.
 * To actually publish, you need:
 * 1. PRIVATE_KEY environment variable
 * 2. Wallet with STT tokens
 * 3. Registered schema on-chain
 */

import { NextResponse } from "next/server";
import { SDK, SchemaEncoder, zeroBytes32 } from "@somnia-chain/streams";
import { createPublicClient, createWalletClient, http, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { somniaTestnet } from "viem/chains";
import {
  SCHEMA_CONFIG,
  formatTransactionForSchema,
  transactionStreamSchema,
} from "@/lib/sds-schema";

// NOTE: This endpoint is DEMO ONLY
// It shows the proper SDS pattern but won't actually publish without credentials

export async function GET() {
  try {
    const rpcUrl = process.env.RPC_URL || "https://dream-rpc.somnia.network";

    // Check if we have publishing credentials
    const hasCredentials = !!process.env.PRIVATE_KEY;

    if (!hasCredentials) {
      return NextResponse.json({
        success: false,
        mode: "demo",
        message:
          "Publishing requires PRIVATE_KEY environment variable. Showing demo pattern only.",
        pattern: {
          step1: "Register schema with registerDataSchemas()",
          step2: "Register event with registerEventSchemas()",
          step3: "Monitor blocks and encode transaction data",
          step4: "Publish with setAndEmitEvents()",
          step5: "Frontend subscribes with subscribe()",
        },
        documentation:
          "https://docs.somnia.network/somnia-data-streams/basics/somnia-data-streams-reactivity",
      });
    }

    // Initialize SDK with wallet for publishing
    const account = privateKeyToAccount(
      process.env.PRIVATE_KEY as `0x${string}`
    );

    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      chain: somniaTestnet,
      account,
      transport: http(rpcUrl),
    });

    const sdk = new SDK({
      public: publicClient,
      wallet: walletClient,
    });

    // STEP 1: Register schema (one-time operation)
    console.log("[SDS Publisher] Registering transaction stream schema...");

    const schemaRegistration = await sdk.streams.registerDataSchemas(
      [
        {
          schemaName: SCHEMA_CONFIG.transactionStreamName,
          schema: SCHEMA_CONFIG.schema,
          parentSchemaId: SCHEMA_CONFIG.parentSchemaId,
        },
      ],
      true // Ignore if already registered
    );

    console.log("[SDS Publisher] Schema registration:", schemaRegistration);

    // STEP 2: Compute schema ID
    const schemaId = await sdk.streams.computeSchemaId(transactionStreamSchema);
    console.log("[SDS Publisher] Schema ID:", schemaId);

    // STEP 3: Register event schema (one-time)
    console.log("[SDS Publisher] Registering event schema...");

    const eventRegistration = await sdk.streams.registerEventSchemas([
      {
        id: SCHEMA_CONFIG.transactionBroadcastEventId,
        schema: SCHEMA_CONFIG.eventSchema,
      },
    ]);

    console.log("[SDS Publisher] Event registration:", eventRegistration);

    // STEP 4: Get latest block and prepare data
    const latestBlock = await publicClient.getBlock({
      includeTransactions: true,
    });

    // STEP 5: Encode transaction data per schema
    const schemaEncoder = new SchemaEncoder(transactionStreamSchema);

    const dataStreams = latestBlock.transactions.slice(0, 10).map((tx: any) => {
      const formattedTx = formatTransactionForSchema(tx, latestBlock);

      const encodedData = schemaEncoder.encodeData([
        {
          name: "timestamp",
          value: formattedTx.timestamp.toString(),
          type: "uint64",
        },
        { name: "txHash", value: formattedTx.txHash, type: "bytes32" },
        {
          name: "fromAddress",
          value: formattedTx.fromAddress,
          type: "address",
        },
        { name: "toAddress", value: formattedTx.toAddress, type: "address" },
        { name: "value", value: formattedTx.value.toString(), type: "uint256" },
        {
          name: "gasUsed",
          value: formattedTx.gasUsed.toString(),
          type: "uint256",
        },
        { name: "txType", value: formattedTx.txType, type: "string" },
        { name: "blockHash", value: formattedTx.blockHash, type: "bytes32" },
        {
          name: "blockNumber",
          value: formattedTx.blockNumber.toString(),
          type: "uint256",
        },
      ]);

      // Ensure schemaId is a hex string
      const validSchemaId =
        schemaId instanceof Error || !schemaId
          ? (("0x" + "0".repeat(64)) as `0x${string}`)
          : schemaId;

      return {
        id: toHex(tx.hash, { size: 32 }),
        schemaId: validSchemaId,
        data: encodedData,
      };
    });

    // STEP 6: Prepare event streams
    const eventStreams = [
      {
        id: SCHEMA_CONFIG.transactionBroadcastEventId,
        argumentTopics: [
          toHex(latestBlock.number!, { size: 32 }), // blockNumber (indexed)
        ],
        data: toHex(dataStreams.length, { size: 32 }), // txCount
      },
    ];

    // STEP 7: Publish data + emit events (ATOMIC OPERATION!)
    console.log("[SDS Publisher] Publishing data and emitting events...");

    const txHash = await sdk.streams.setAndEmitEvents(
      dataStreams,
      eventStreams
    );

    console.log("[SDS Publisher] ✅ Published! Transaction:", txHash);

    return NextResponse.json({
      success: true,
      mode: "live",
      txHash,
      blockNumber: Number(latestBlock.number),
      transactionsPublished: dataStreams.length,
      schemaId,
      eventId: SCHEMA_CONFIG.transactionBroadcastEventId,
      message:
        "Data published to SDS. Subscribers will receive instant push notifications.",
    });
  } catch (error) {
    console.error("[SDS Publisher] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
