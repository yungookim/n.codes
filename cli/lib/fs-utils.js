function createDryRunFs(fs, io) {
  return {
    ...fs,
    writeFileSync(targetPath) {
      io.log(`[dry-run] write ${targetPath}`);
    },
  };
}

module.exports = { createDryRunFs };
