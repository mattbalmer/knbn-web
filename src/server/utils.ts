export const getCWD = (): string => {
  return process.env.KNBN_CWD || process.cwd();
}