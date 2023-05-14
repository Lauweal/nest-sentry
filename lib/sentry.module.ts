import { Module, DynamicModule, Global } from '@nestjs/common';
import { SentryCoreModule } from './sentry-core.module';
import { SentryModuleOptions, SentryModuleAsyncOptions } from './sentry.interfaces';

@Global()
@Module({})
export class SentryModule {
  public static forRoot(options: SentryModuleOptions): DynamicModule {
    return {
      global: true,
      module: SentryModule,
      imports: [SentryCoreModule.forRoot(options)],
    };
  }

  public static forRootAsync(options: SentryModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: SentryModule,
      imports: [SentryCoreModule.forRootAsync(options)],
    };
  }
}