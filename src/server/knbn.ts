export * from 'knbn-core/utils/board';
export { createBoard } from 'knbn-core/actions/board';
export * from 'knbn-core/actions/task';
export * from 'knbn-core/utils/board-files';
import { version, boardVersion } from 'knbn-core/package.json';

export const KNBN_CORE_VERSION = version;
export const KNBN_BOARD_VERSION = boardVersion;
