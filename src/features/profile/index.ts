export const AVATARS = {
  1: require('../../../assets/avatars/1.png'),
  2: require('../../../assets/avatars/2.png'),
  3: require('../../../assets/avatars/3.png'),
  4: require('../../../assets/avatars/4.png'),
  5: require('../../../assets/avatars/5.png'),
  6: require('../../../assets/avatars/6.png'),
  7: require('../../../assets/avatars/7.png'),
  8: require('../../../assets/avatars/8.png'),
  9: require('../../../assets/avatars/9.png'),
  10: require('../../../assets/avatars/10.png'),
  11: require('../../../assets/avatars/11.png'),
  12: require('../../../assets/avatars/12.png'),
  13: require('../../../assets/avatars/13.png'),
  14: require('../../../assets/avatars/14.png'),
  15: require('../../../assets/avatars/15.png'),
  16: require('../../../assets/avatars/16.png'),
  17: require('../../../assets/avatars/17.png'),
  18: require('../../../assets/avatars/18.png'),
  19: require('../../../assets/avatars/19.png'),
  20: require('../../../assets/avatars/20.png'),
} as const;

export const AVATARS_LIST = Object.values(AVATARS);
export const getAvatar = (id: number) => AVATARS_LIST[id - 1];
