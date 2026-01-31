export type JwtTokenType = {
  access_token: string;
  refresh_token: string;
  consent: boolean;
};

export type IssueTokenType = {
  access_token: string;
  refresh_token: string;
};
