import { Inject, Injectable, ConsoleLogger, OnApplicationShutdown } from '@nestjs/common';
import { ClientOptions, Client } from '@sentry/types';
import * as Sentry from '@sentry/node';
import { SENTRY_MODULE_OPTIONS } from './sentry.constants';
import { SentryModuleOptions } from './sentry.interfaces';

@Injectable()
export class SentryService extends ConsoleLogger implements OnApplicationShutdown {
  private static serviceInstance: SentryService;
  private static sentry = Sentry;
  constructor(
    @Inject(SENTRY_MODULE_OPTIONS)
    readonly opts?: SentryModuleOptions,
  ) {
    super();
    if (!(opts && opts.dsn)) {
      // console.log('options not found. Did you use SentryModule.forRoot?');
      return;
    }
    const { debug, integrations = [], ...sentryOptions } = opts;
    Sentry.init({
      ...sentryOptions,
      integrations: [
        new Sentry.Integrations.OnUncaughtException({
          onFatalError: async (err) => {
            // console.error('uncaughtException, not cool!')
            // console.error(err);
            if (err.name === 'SentryError') {
              console.log(err);
            } else {
              (
                Sentry.getCurrentHub().getClient<
                  Client<ClientOptions>
                >() as Client<ClientOptions>
              ).captureException(err);
              process.exit(1);
            }
          },
        }),
        new Sentry.Integrations.OnUnhandledRejection({ mode: 'warn' }),
        ...integrations,
      ],
    });
  }

  public static SentryServiceInstance(): SentryService {
    if (!SentryService.serviceInstance) {
      SentryService.serviceInstance = new SentryService();
    }
    return SentryService.serviceInstance;
  }

  public get sdk() {
    return Sentry;
  }

  log(message: string, context?: string, asBreadcrumb?: boolean) {
    message = `[LOG] ${message}`;
    try {
      super.log(message, context);
      asBreadcrumb ?
        Sentry.addBreadcrumb({
          message,
          level: 'log',
          data: {
            context
          }
        }) :
        Sentry.captureMessage(message, {
          level: 'log',
          extra: {
            log: context,
          },
        });
    } catch (err) { }
  }

  error(message: string, trace?: string, context?: string) {
    message = `[ERROR] ${message}`;
    try {
      super.error(message, trace);
      Sentry.captureMessage(message, {
        level: 'error',
        extra: {
          error: context,
        },
      });
    } catch (err) { }
  }

  warn(message: string, context?: string, asBreadcrumb?: boolean) {
    message = `[WARN] ${message}`;
    try {
      super.warn(message);
      asBreadcrumb ?
        Sentry.addBreadcrumb({
          message,
          level: 'warning',
          data: {
            context
          }
        }) :
        Sentry.captureMessage(message, {
          level: 'warning',
          extra: {
            warn: context,
          },
        });
    } catch (err) { }
  }

  debug(message: string, context?: string, asBreadcrumb?: boolean) {
    message = `[DEBUG] ${message}`;
    try {
      super.debug(message);
      asBreadcrumb ?
        Sentry.addBreadcrumb({
          message,
          level: 'debug',
          data: {
            context
          }
        }) :
        Sentry.captureMessage(message, {
          level: 'debug',
          extra: {
            debug: context,
          },
        });
    } catch (err) { }
  }

  verbose(message: string, context?: string, asBreadcrumb?: boolean) {
    message = `[VERBOSE] ${message}`;
    try {
      super.verbose(message);
      asBreadcrumb ?
        Sentry.addBreadcrumb({
          message,
          level: 'info',
          data: {
            context
          }
        }) :
        Sentry.captureMessage(message, {
          level: 'info',
          extra: {
            verbose: context,
          },
        });
    } catch (err) { }
  }

  async onApplicationShutdown(signal?: string) {
    if (this.opts?.close?.enabled === true) {
      await Sentry.close(this.opts?.close.timeout);
    }
  }

}