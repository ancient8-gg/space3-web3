import {
  erc20,
  erc721,
  erc1155,
} from '../typechain/factories/@openzeppelin/contracts/token'

const { IERC20__factory } = erc20
const { IERC721__factory } = erc721
const { IERC1155__factory } = erc1155

export {
  IERC20__factory as IERC20,
  IERC721__factory as IERC721,
  IERC1155__factory as IERC1155,
}
