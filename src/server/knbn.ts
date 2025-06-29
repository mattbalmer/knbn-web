// TODO: Figure out better import/export paths
export { loadBoard, updateTaskInBoard, saveBoard } from 'knbn/src/core/boardUtils';
import { version, boardVersion } from 'knbn/package.json';

export const KNBN_CORE_VERSION = version;
export const KNBN_BOARD_VERSION = boardVersion;
