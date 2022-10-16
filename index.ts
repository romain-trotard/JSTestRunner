const vm = require('vm');
const fs = require('fs/promises');
const path = require('path');
const chalk = require('chalk');

type TestCallback = () => void;
type DescribeCallback = () => void;

type TestInfo = {
    name: string;
    test: TestCallback;
}

let tests: TestInfo[] = [];
const describes: { name: string; describe: DescribeCallback }[] = [];

function describe(describeName: string, describeToRun: DescribeCallback) {
    describes.push({
        name: describeName,
        describe: describeToRun
    });
}

function test(testName: string, testToRun: TestCallback) {
    tests.push({
        name: testName,
        test: testToRun
    });
}

const expect = (value: unknown) => ({
    toBe(expectedValue: unknown) {
        if (value !== expectedValue) {
            throw new Error(`expect(${chalk.red('received')}).toBe(${chalk.green('expected')})\nExpected: ${chalk.green(expectedValue)}\nReceived: ${chalk.red(value)}`);
        }
    }
});

async function runTest() {
    const testFile = await fs.readFile(path.join(__dirname, 'testFile.js'), { encoding: 'utf-8' });
    const context = vm.createContext({ test, expect, describe });

    vm.runInNewContext(testFile, context);

    const allTests = [...tests];
    tests = [];

    describes.forEach(({ name: describeName, describe }) => {
        describe();

        tests.forEach(({ name, test }) => {
            allTests.push({ name: describeName + ' ' + name, test });
        });

        // Clear tests for the next describe
        tests = []
    });

    allTests.forEach(async ({ name, test }) => {
        try {
            test();
            console.log(chalk.green(`"${name}" passed`));
        } catch (e) {
            console.log(chalk.red(`"${name}" failed`), '\n', e.message);
        }

    });
}

runTest();

