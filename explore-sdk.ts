/**
 * SDK Exploration Script v2
 * Purpose: Inspect the MonoPulse class
 */

import { MonoPulse } from 'monopulse';

console.log('=== MonoPulse Class Exploration ===\n');

// Check the MonoPulse object/class structure
console.log('MonoPulse type:', typeof MonoPulse);
console.log('\n');

// Check if it's a class or constructor
console.log('MonoPulse constructor:', MonoPulse.toString().substring(0, 200));
console.log('\n');

// Try to get static methods
console.log('Static methods and properties:');
console.log(Object.getOwnPropertyNames(MonoPulse));
console.log('\n');

// Try to get prototype methods
console.log('Instance methods (prototype):');
console.log(Object.getOwnPropertyNames(MonoPulse.prototype));
console.log('\n');

// Try to inspect the package.json or type definitions
try {
    console.log('=== Attempting to create an instance ===');
    // This might fail without proper configuration, but we can see what parameters it expects
    const instance = new (MonoPulse as any)();
    console.log('Instance created successfully!');
    console.log('Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
} catch (error) {
    console.log('Failed to create instance:', (error as Error).message);
    console.log('This is expected - we need to check the constructor signature');
}

export { };
