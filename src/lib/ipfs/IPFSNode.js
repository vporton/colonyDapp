/* @flow */

import IPFS from 'ipfs';

import { sleep } from '../../utils/time';
import { isDev } from '../../utils/debug';

import devConfig from './ipfsConfig.development';
import prodConfig from './ipfsConfig.production';

import type { B58String, IPFSNodeOptions, IPFSPeer } from './types';
import PinnerConnector from './PinnerConnector';

const PINNING_ROOM = process.env.PINNING_ROOM || 'COLONY_PINNING_ROOM';
// The latter is the pinner id of our dev pinner
const PINNER_ID =
  process.env.PINNER_ID || 'QmQBF89g7VHjcQVNGEf5jKZnU5r6J8G2vfHzBpivKqgxs6';

const TIMEOUT = process.env.CI ? 50000 : 10000;

class IPFSNode {
  static getIpfsConfig = isDev ? devConfig : prodConfig;

  /** Turn a `swarm.peers()` result item into its B58 representation (Qm....) */
  static peerToB58String = (peerItem: IPFSPeer): B58String =>
    peerItem.peer.id.toB58String();

  _ipfs: IPFS;

  pinner: PinnerConnector;

  ready: Promise<boolean>;

  constructor(ipfs: IPFS, { timeout = TIMEOUT }: IPFSNodeOptions = {}) {
    this._ipfs = ipfs;
    this.ready = new Promise((resolve, reject) => {
      // Check whether IPFS is already connected?
      if (this._ipfs.isOnline()) {
        resolve(true);
        return;
      }
      const connectTimeout = setTimeout(() => {
        reject(new Error('IPFS connection timed out.'));
      }, timeout);
      this._ipfs.on('ready', () => {
        clearTimeout(connectTimeout);
        resolve(true);
      });
      this._ipfs.on('error', err => {
        clearTimeout(connectTimeout);
        reject(err);
      });
    });
  }

  async connectPinner() {
    if (!PINNER_ID) {
      throw new Error(
        'No pinner id specified in environment variables. But we need one.',
      );
    }
    this.pinner = new PinnerConnector(this.getIPFS(), PINNING_ROOM, PINNER_ID);
    await this.ready;
    await this.pinner.init();
  }

  /** Get the IPFS instance (to use in 3rd party libraries (e.g. orbit-db)) */
  getIPFS() {
    return this._ipfs;
  }

  /**
   * Get the peers swarm'd by this ipfs node.
   * Return a promise that'll resolve to undefined
   * (no peer found) or the list of peers.
   */
  async getPeers(): Promise<?(IPFSPeer[])> {
    const peers: ?(IPFSPeer[]) = await this._ipfs.swarm.peers();

    if (peers && peers.length && peers.length > 0) {
      return peers;
    }

    return null;
  }

  /**
   * Wait until some peers have been detected.
   * Returns a promise that'll resolve into the list
   * of current peers.
   */
  async waitForSomePeers(): Promise<IPFSPeer[]> {
    let peers: ?(IPFSPeer[]) = await this.getPeers();

    // TODO: in offline mode this would go into an infinite loop.
    while (!peers || !peers.length) {
      /* eslint-disable no-await-in-loop */
      await sleep(500);
      peers = await this.getPeers();
      /* eslint-enable no-await-in-loop */
    }

    return peers;
  }

  /** Wait until the peer identified by peerID (B58 string representation) shows up */
  async waitForPeer(peerID: B58String): Promise<boolean> {
    let peers = await this.waitForSomePeers();
    let peersB58 = peers.map(this.constructor.peerToB58String);

    while (peersB58.indexOf(peerID) < 0) {
      /* eslint-disable no-await-in-loop */
      await sleep(500);
      peers = await this.waitForSomePeers();
      peersB58 = peers.map(this.constructor.peerToB58String);
      /* eslint-enable no-await-in-loop */
    }

    return true;
  }

  /** Return a file from IPFS as text */
  async getString(hash: string): Promise<string> {
    await this.ready;
    const result = await this._ipfs.files.cat(hash);
    if (!result) throw new Error('No such file');
    return result.toString();
  }

  /** Upload a string */
  async addString(data: string): Promise<string> {
    await this.ready;
    const [result] = await this._ipfs.files.add(
      this._ipfs.types.Buffer.from(data),
    );
    if (!result) throw new Error('Failed to upload to IPFS');
    if (this.pinner) {
      this.pinner.pinHash(result.hash);
    }
    return result.path;
  }

  /** Promise that returns the given node ID */
  async getNodeID(): Promise<B58String> {
    const { id } = await this._ipfs.id();
    return id;
  }

  /** Start the connection to IPFS (if not connected already) */
  start(): Promise<void> {
    return this._ipfs.start();
  }

  /** Stop the connection to IPFS */
  async stop(): Promise<void> {
    if (this.pinner) {
      await this.pinner.disconnect();
    }
    return this._ipfs.stop();
  }
}

export default IPFSNode;
