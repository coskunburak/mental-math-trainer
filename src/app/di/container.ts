export type Token<T> = symbol & { readonly __type?: T };

type Factory<T> = (container: Container) => T;

type Registration<T> = {
  singleton: boolean;
  factory: Factory<T>;
  instance?: T;
};

export class Container {
  private readonly registry = new Map<Token<unknown>, Registration<unknown>>();

  registerSingleton<T>(token: Token<T>, factory: Factory<T>): void {
    this.registry.set(token as Token<unknown>, {
      singleton: true,
      factory: factory as Factory<unknown>,
    });
  }

  registerFactory<T>(token: Token<T>, factory: Factory<T>): void {
    this.registry.set(token as Token<unknown>, {
      singleton: false,
      factory: factory as Factory<unknown>,
    });
  }

  resolve<T>(token: Token<T>): T {
    const registration = this.registry.get(token as Token<unknown>);

    if (!registration) {
      throw new Error(`Token not registered: ${String(token.description ?? token.toString())}`);
    }

    if (registration.singleton) {
      if (registration.instance === undefined) {
        registration.instance = registration.factory(this);
      }

      return registration.instance as T;
    }

    return registration.factory(this) as T;
  }
}
