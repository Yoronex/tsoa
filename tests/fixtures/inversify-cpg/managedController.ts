import { inject } from 'inversify';
import { Get, Route, Security } from '@tsoa/runtime';
import { TestModel } from '../testModel';
import { ManagedService } from './managedService';
import { provideSingleton } from './provideSingleton';

@provideSingleton(ManagedController)
@Route('ManagedTest')
@Security('MySecurity')
export class ManagedController {
  constructor(@inject(ManagedService) private managedService: ManagedService) {}

  @Get()
  public async getModel(): Promise<TestModel> {
    return this.managedService.getModel();
  }

  @Get('ThrowsError')
  public getThrowsError(): void {
    throw new Error('error thrown');
  }
}
