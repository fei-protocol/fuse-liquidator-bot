import { FusePoolUser, FusePoolUserWithAssets, Pool } from './utils';
import { BigNumber } from 'ethers';
import { getPotentialLiquidation } from './index';
import { Fuse } from '@midas-capital/sdk';

export default async function gatherLiquidations(
  fuse: Fuse,
  comptrollers: Array<string>,
  users: Array<Array<FusePoolUser>>,
  closeFactors: Array<BigNumber>,
  liquidationIncentives: Array<BigNumber>,
  pools: Pool
) {
  for (let i = 0; i < comptrollers.length; i++) {
    users[i].slice().sort((a, b) => b.totalBorrow - a.totalBorrow);
    const liquidations = [];

    for (let j = 0; j < users[i].length; j++) {
      console.log('gatherLiquidations', ' for user: ', j, 'comptroller: ', i);
      const userAssets = await fuse.contracts.FusePoolLens.callStatic.getPoolAssetsByUser(
        comptrollers[i],
        users[i][j].account
      );
      const userWithAssets: FusePoolUserWithAssets = { ...users[i][j], assets: userAssets };
      const liquidation = await getPotentialLiquidation(
        fuse,
        userWithAssets,
        closeFactors[i],
        liquidationIncentives[i]
      );
      if (liquidation !== null) liquidations.push(liquidation);
    }
    if (liquidations.length > 0) {
      pools[comptrollers[i]] = liquidations;
    }
  }
  return pools;
}
