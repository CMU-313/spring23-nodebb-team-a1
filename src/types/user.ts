import { GroupFullObject } from './group';
import { StatusObject } from './status';

export type UserObjectSlim = {
  uid: number;
  username: string;
  displayname: string;
  userslug: string;
  picture: string;
  status: StatusObject;
  postcount: number;
  reputation: number;
  'email:confirmed': number;
  lastonline: number;
  flags: number;
  banned: number;
  'banned:expire': number;
  joindate: number;
  accounttype: string;
  'icon:text': string;
  'icon:bgColor': string;
  joindateISO: string;
  lastonlineISO: string;
  banned_until: number;
  banned_until_readable: string;
};

export type UserObjectACP = UserObjectSlim & {
  administrator: boolean;
  ip: string;
  ips: string[];
};

export type UserObject = UserObjectSlim & {
  email: string;
  fullname: string;
  location: string;
  birthday: string;
  website: string;
  aboutme: string;
  signature: string;
  uploadedpicture: string;
  profileviews: number;
  topiccount: number;
  lastposttime: number;
  followerCount: number;
  followingCount: number;
  'cover:url': string;
  'cover:position': string;
  groupTitle: string;
  groupTitleArray: string[];
};

export type UserObjectFull = UserObject & {
  aboutmeParsed: string;
  age: number;
  emailClass: string;
  ips: string[];
  moderationNote: string;
  counts: Counts;
  isBlocked: boolean;
  blocksCount: number;
  yourid: number;
  theirid: number;
  isTargetAdmin: boolean;
  isAdmin: boolean;
  isGlobalModerator: boolean;
  isModerator: boolean;
  isAdminOrGlobalModerator: boolean;
  isAdminOrGlobalModeratorOrModerator: boolean;
  isSelfOrAdminOrGlobalModerator: boolean;
  canEdit: boolean;
  canBan: boolean;
  canFlag: boolean;
  canChangePassword: boolean;
  isSelf: boolean;
  isFollowing: boolean;
  hasPrivateChat: number;
  showHidden: boolean;
  groups: GroupFullObject[];
  disableSignatures: boolean;
  'reputation:disabled': boolean;
  'downvote:disabled': boolean;
  profile_links: ProfileLink[];
  sso: SSO[];
  websiteLink: string;
  websiteName: string;
  'username:disableEdit': number;
  'email:disableEdit': number;
};

export type Counts = {
  best: number;
  blocks: number;
  bookmarks: number;
  categoriesWatched: number;
  downvoted: number;
  followers: number;
  following: number;
  groups: number;
  ignored: number;
  posts: number;
  topics: number;
  uploaded: number;
  upvoted: number;
  watched: number;
};

export type ProfileLink = {
  id: string;
  route: string;
  name: string;
  visibility: Visibility;
  public: boolean;
  icon: string;
};

export type Visibility = {
  self: boolean;
  other: boolean;
  moderator: boolean;
  globalMod: boolean;
  admin: boolean;
  canViewInfo: boolean;
};

export type SSO = {
  associated: boolean;
  url: string;
  name: string;
  icon: string;
  deathUrl: string;
};
