import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';
import {
  DefineTargetFieldDto,
  MapFieldToProviderDto,
} from './dto/create-custom-field.dto';
import { v4 as uuidv4 } from 'uuid';
import { StandardObject } from '../utils/types';

@Injectable()
export class FieldMappingService {
  constructor(private prisma: PrismaService, private logger: LoggerService) {
    this.logger.setContext(FieldMappingService.name);
  }

  async getAttributes() {
    return await this.prisma.attribute.findMany();
  }

  async getValues() {
    return await this.prisma.value.findMany();
  }

  async getEntities() {
    return await this.prisma.entity.findMany();
  }

  // and then retrieve them by their name
  /*async getEntityId(standardObject: StandardObject) {
    const res = await this.prisma.entity.findFirst({
      where: {
        ressource_owner_id: standardObject as string,
      },
    });
    return res.id_entity;
  }*/

  async getCustomFieldMappings(
    integrationId: string,
    linkedUserId: string,
    standard_object: string,
  ) {
    return await this.prisma.attribute.findMany({
      where: {
        source: integrationId,
        id_consumer: linkedUserId,
        ressource_owner_type: standard_object,
      },
      select: {
        remote_id: true,
        slug: true,
      },
    });
  }

  async defineTargetField(dto: DefineTargetFieldDto) {
    // Create a new attribute in your system representing the target field
    //const id_entity = await this.getEntityId(dto.object_type_owner);
    //this.logger.log('id entity is ' + id_entity);
    const attribute = await this.prisma.attribute.create({
      data: {
        id_attribute: uuidv4(),
        ressource_owner_type: dto.object_type_owner as string,
        slug: dto.name,
        description: dto.description,
        data_type: dto.data_type,
        status: 'defined', // [defined | mapped]
        // below is done in step 2
        remote_id: '',
        source: '',
        //id_entity: id_entity,
        scope: 'user', // [user | org] wide
      },
    });

    return attribute;
  }

  async mapFieldToProvider(dto: MapFieldToProviderDto) {
    try {
      const updatedAttribute = await this.prisma.attribute.update({
        where: {
          id_attribute: dto.attributeId.trim(),
        },
        data: {
          remote_id: dto.source_custom_field_id,
          source: dto.source_provider,
          id_consumer: dto.linked_user_id.trim(),
          status: 'mapped',
        },
      });

      return updatedAttribute;
    } catch (error) {
      throw new Error(error);
    }
  }
}
