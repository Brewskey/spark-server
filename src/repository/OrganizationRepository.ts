import { Organization, User } from '@brewskey/spark-protocol';
import { RepositoryBase } from '@brewskey/spark-protocol';
import nullthrows from 'nullthrows';
import { Repository } from 'typeorm';

type MutateOrganizationDTO = Omit<
  Organization,
  'id' | 'createdAt' | 'updatedAt' | 'products' | 'webhooks'
>;

class OrganizationRepository extends RepositoryBase<
  Organization,
  MutateOrganizationDTO
> {
  constructor(
    repository: Repository<Organization>,
    private readonly userRepository: Repository<User>,
  ) {
    super(Organization, repository);
  }

  async getByUserID(userID: number): Promise<Organization[]> {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userID },
      relations: { organizations: true },
    });

    return nullthrows(user.organizations);
  }

  updateByID(): Promise<Organization> {
    throw new Error('The method is not implemented');
  }
}

export default OrganizationRepository;
