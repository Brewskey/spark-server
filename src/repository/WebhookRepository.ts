import { RepositoryBase, Webhook } from '@brewskey/spark-protocol';
import { Repository } from 'typeorm';

class WebhookRepository extends RepositoryBase<
  Webhook,
  Omit<Webhook, 'createdAt' | 'updatedAt' | 'organization'>
> {
  constructor(repository: Repository<Webhook>) {
    super(Webhook, repository);
  }

  async updateByID(): Promise<Webhook> {
    throw new Error('The method is not implemented');
  }
}

export default WebhookRepository;
