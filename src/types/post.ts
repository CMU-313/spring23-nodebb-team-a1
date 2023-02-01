import { CategoryObject } from './category';
import { TopicObject } from './topic';
import { UserObjectSlim } from './user';

export type PostObject = {
  pid: number;
  tid: number;
  content: string;
  uid: number;
  timestamp: number;
  deleted: boolean;
  upvotes: number;
  downvotes: number;
  votes: number;
  timestampISO: string;
  user: UserObjectSlim;
  topic: TopicObject;
  category: CategoryObject;
  isMainPost: boolean;
  replies: number;
};
