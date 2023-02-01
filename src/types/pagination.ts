export type PaginationObject = {
  pagination: Pagination;
};

export interface Pagination {
  prev: ActivePage;
  next: ActivePage;
  first: ActivePage;
  last: ActivePage;
  rel: Relation[];
  pages: Page[];
  currentPage: number;
  pageCount: number;
}

interface ActivePage {
  page: number;
  active: boolean;
}

interface Relation {
  rel: string;
  href: string;
}

interface Page {
  page: number;
  active: boolean;
  qs: string;
}
