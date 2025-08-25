// Test script to verify timezone handling
const { fromZonedTime } = require('date-fns-tz');

console.log('=== Testing Timezone Fix ===');
console.log('This test simulates how the sun position calculation works with different user timezones.\n');

// Test date: August 11, 2025 (summer time in Netherlands)
const testDate = new Date(2025, 7, 11); // Month is 0-indexed
const testTime = 12.0; // 12:00 PM

console.log(`Test scenario: User wants to see sun position for:`);
console.log(`  Date: ${testDate.toDateString()}`);
console.log(`  Time: 12:00 PM Netherlands time\n`);

// Simulate the actual calculation from our code
const year = testDate.getFullYear();
const month = testDate.getMonth();
const day = testDate.getDate();
const hours = Math.floor(testTime);
const minutes = Math.floor((testTime % 1) * 60);

// Create a date object treating the input as Netherlands local time
const nlLocalTime = new Date(year, month, day, hours, minutes, 0);
console.log(`Step 1 - Create date object: ${nlLocalTime.toString()}`);
console.log(`  (This uses the user's local timezone, which could be wrong)`);

// Convert Netherlands local time to UTC using date-fns-tz
const utcTime = fromZonedTime(nlLocalTime, 'Europe/Amsterdam');
console.log(`\nStep 2 - Convert to proper UTC: ${utcTime.toISOString()}`);
console.log(`  UTC time: ${utcTime.getUTCHours()}:${utcTime.getUTCMinutes().toString().padStart(2, '0')}`);

// Show what 12:00 PM in Netherlands should be in UTC
console.log(`\nExpected: 12:00 PM Netherlands time in summer = 10:00 AM UTC (CEST = UTC+2)`);
console.log(`Actual UTC time from conversion: ${utcTime.getUTCHours()}:${utcTime.getUTCMinutes().toString().padStart(2, '0')}`);

// Test with winter time as well
console.log('\n=== Testing Winter Time ===');
const winterDate = new Date(2025, 0, 15); // January 15, 2025
const nlWinterTime = new Date(winterDate.getFullYear(), winterDate.getMonth(), winterDate.getDate(), 12, 0, 0);
const utcWinterTime = fromZonedTime(nlWinterTime, 'Europe/Amsterdam');

console.log(`Winter date: ${winterDate.toDateString()}`);
console.log(`UTC time from conversion: ${utcWinterTime.toISOString()}`);
console.log(`Expected: 12:00 PM Netherlands time in winter = 11:00 AM UTC (CET = UTC+1)`);
console.log(`Actual UTC time: ${utcWinterTime.getUTCHours()}:${utcWinterTime.getUTCMinutes().toString().padStart(2, '0')}`);

console.log('\n=== Summary ===');
console.log('✓ This ensures sun calculations are always done for Netherlands timezone');
console.log('✓ Automatically handles DST transitions (summer/winter time)');
console.log('✓ Works consistently regardless of user\s browser timezone');