import { TagObject } from './tag';

export type CommonProps = {
  loggedIn: boolean;
  relative_path: string;
  template: Template;
  url: string;
  bodyClass: string;
  _header: Header;
  widgets: Widget[];
};

export interface Template {
  name: string;
}

export interface Header {
  tags: TagObject[];
  link: Link[];
}

export interface Link {
  rel: string;
  type: string;
  href: string;
  title: string;
  sizes: string;
  as: string;
}

export interface Widget {
  html: string;
}
