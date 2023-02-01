export type CategoryObject = {
  cid: number;
  name: string;
  description: string;
  descriptionParsed: string;
  icon: string;
  bgColor: string;
  color: string;
  slug: string;
  parentCid: number;
  topic_count: number;
  post_count: number;
  disabled: number;
  order: number;
  link: string;
  numRecentReplies: number;
  class: string;
  imageClass: string;
  isSection: number;
  minTags: number;
  maxTags: number;
  postQueue: number;
  totalPostCount: number;
  totalTopicCount: number;
  subCategoriesPerPage: number;
};

export type CategoryOptionalProperties = {
  cid: number;
  backgroundImage: string;
};
