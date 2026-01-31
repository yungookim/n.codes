function createNodeIO({ input = process.stdin, output = process.stdout, readline = require('readline') } = {}) {
  const rl = readline.createInterface({ input, output });
  return {
    prompt(question) {
      return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer));
      });
    },
    log(message) {
      output.write(`${message}\n`);
    },
    error(message) {
      output.write(`${message}\n`);
    },
    close() {
      rl.close();
    },
  };
}

function createMemoryIO({ responses = [] } = {}) {
  const logs = [];
  const errors = [];
  let index = 0;
  return {
    prompt() {
      const response = responses[index] ?? '';
      index += 1;
      return Promise.resolve(response);
    },
    log(message) {
      logs.push(message);
    },
    error(message) {
      errors.push(message);
    },
    close() {},
    getLogs() {
      return logs.slice();
    },
    getErrors() {
      return errors.slice();
    },
  };
}

module.exports = {
  createNodeIO,
  createMemoryIO,
};
