export class AccessToken {
  private readonly token: string;

  readonly expiredAt: Date;

  constructor(token: string, expiredAt: Date) {
    this.token = token;
    this.expiredAt = expiredAt;
  }

  get() { return this.token; }

  isValid() {
    return this.expiredAt > new Date();
  }
}
