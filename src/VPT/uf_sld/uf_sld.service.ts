import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../../redisService';

import { error } from 'console';

@Injectable()
export class UfSldService {
  constructor(private readonly redisService: RedisService) {}
  async getJson(
    applicationName,
    version,
    artifact,
    tenant,
    appGroup,
    fabrics,
  ): Promise<any> {
    try {
      let res = {};
      const nodes: Promise<any> = new Promise((resolve, reject) => {
        try {
          const node = this.readReddis(
            [tenant] +
              ':' +
              [appGroup] +
              ':' +
              [applicationName] +
              ':' +
              [fabrics] +
              ':' +
              [artifact] +
              ':' +
              [version] +
              ':' +
              'nodes',
          );
          resolve(node);
        } catch (error) {
          reject(error);
        }
      });

      const nodeEdges: Promise<any> = new Promise((resolve, reject) => {
        try {
          const nodeEdge = this.readReddis(
            [tenant] +
              ':' +
              [appGroup] +
              ':' +
              [applicationName] +
              ':' +
              [fabrics] +
              ':' +
              [artifact] +
              ':' +
              [version] +
              ':' +
              'nodeEdges',
          );
          resolve(nodeEdge);
        } catch (error) {
          reject(error);
        }
      });

      const nodeProperty: Promise<any> = new Promise((resolve, reject) => {
        try {
          const property = this.readReddis(
            [tenant] +
              ':' +
              [appGroup] +
              ':' +
              [applicationName] +
              ':' +
              [fabrics] +
              ':' +
              [artifact] +
              ':' +
              [version] +
              ':' +
              'nodeProperty',
          );
          resolve(property);
        } catch (error) {
          reject(error);
        }
      });

      const result = await Promise.all([nodes, nodeEdges, nodeProperty])
        .then((values) => {
          console.log('🚀 ~ AppService ~ values:', values);
          return values;
        })
        .catch((error) => {
          throw new BadRequestException(error);
        });

      console.log('🚀 ~ AppService ~ res:', result);
      res = {
        nodes: JSON.parse(result[0]),
        nodeEdges: JSON.parse(result[1]),
        nodeProperty: JSON.parse(result[2]),
      };
      console.log('🚀 ~ AppService ~ res:', res);
      return {
        status: 200,
        data: res,
      };
    } catch (error) {
      throw error;
    }

    // try {
    //   const res = await this.readReddis(tenant);
    //   const application = await JSON.parse(res);
    //   console.log('🚀 ~ AppService ~ application:', application);
    //   let applicationDetails = {};

    //   applicationDetails =
    //     application[tenant][appGroup][fabrics][applicationName][processFlow][
    //       version
    //     ];

    //   return { workflow: { ...applicationDetails } };
    // } catch (error) {
    //   throw error;
    // }
  }

  async deleteApplication(
    applicationName: any,
    tenant: any,
    appGroup,
    fabrics,
  ): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const application = await JSON.parse(res);
      console.log('application --->', application);
      if (application[tenant][appGroup][fabrics][applicationName]) {
        delete application[tenant][appGroup][fabrics][applicationName];
        await this.writeReddis(tenant, application);

        return { msg: 'Successfully Deleted', status: 200 };
      }
      return { msg: 'Application Not Found', status: 400 };
    } catch (error) {
      throw error;
    }
  }

  async getAppGroup(tenant): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const application = await JSON.parse(res);
      const response = [];
      if (
        application &&
        application.hasOwnProperty(tenant) &&
        Object.keys(application[tenant]).length &&
        typeof application === 'object'
      ) {
        const appGroupList = Object.keys(application[tenant]);
        if (appGroupList) {
          for (let appGroup of appGroupList) {
            response.push(appGroup);
          }
        }
      }

      return {
        data: response,
        status: 200,
      };
    } catch (error) {
      throw error;
    }
  }

  async getApplication(tenant, appGroup): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      console.log(applications, 'appllllll');
      const response = [];
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        typeof applications === 'object'
      ) {
        const applicationList = Object.keys(applications[tenant][appGroup]);

        if (applicationList) {
          for (let application of applicationList) {
            response.push(application);
          }
        }
      }

      return {
        data: response,
        status: 200,
      };
    } catch (error) {
      throw error;
    }
  }

  async getFabrics(tenant, appGroup, applicationName): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      console.log(applications, 'appllllll');
      const response = [];
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        applications[tenant][appGroup].hasOwnProperty(applicationName) &&
        applications[tenant][appGroup][applicationName] &&
        typeof applications === 'object'
      ) {
        const fabricsList = Object.keys(
          applications[tenant][appGroup][applicationName],
        );

        if (fabricsList) {
          for (let fabrics of fabricsList) {
            response.push(fabrics);
          }
        }

        return {
          data: response,
          status: 200,
        };
      } else {
        return {
          data: [],
          status: 200,
        };
      }
    } catch (error) {
      throw error;
    }
  }
  async getArtifact(tenant, appGroup, fabrics, applicationName): Promise<any> {
    try {
      const keys = await this.redisService.getKeys(
        `${tenant}:${appGroup}:${applicationName}:${fabrics}`,
      );

      let aritfact = new Set([]);
      if (keys && keys.length > 0) {
        for (let i = 0; i < keys.length; i++) {
          const artifacts = keys[i].split(':');
          if (artifacts.length == 7 && artifacts[4]) aritfact.add(artifacts[4]);
        }
      }

      return {
        data: Array.from(aritfact),
        status: 200,
      };
    } catch (error) {
      throw error;
    }
  }

  async getVersion(
    tenant,
    appGroup,
    fabrics,
    applicationName,
    artifact,
  ): Promise<any> {
    try {
      const keys = await this.redisService.getKeys(
        `${tenant}:${appGroup}:${applicationName}:${fabrics}:${artifact}`,
      );

      let version = new Set([]);
      if (keys && keys.length > 0) {
        for (let i = 0; i < keys.length; i++) {
          const versions = keys[i].split(':');
          if (versions.length == 7 && versions[5]) version.add(versions[5]);
        }
      }

      return {
        data: Array.from(version).sort(),
        status: 200,
      };
    } catch (error) {
      throw error;
    }
  }

  async saveaWorkFlow(
    req: any,
    type: string,
    version: any,
    tenant: string,
    appGroup: string,
    fabrics: string,
  ): Promise<any> {
    try {
      console.log(req.flow, 'req.flow');

      let updateResult = {};
      let result = {};
      let nodeSPLid = [];
      let nodeProSPLid = [];

      let flowNodes = structuredClone(req.flow.nodes);
      let flowNodesProperty = structuredClone(req.flow.nodeProperty);
      let flowNodeEdges = req.flow.nodeEdges;
      if (Object.keys(flowNodes).length > 0) {
        flowNodes.forEach((element) => {
          nodeSPLid.push(element.id);
        });

        if (typeof flowNodesProperty === 'object') {
          Object.keys(flowNodesProperty).forEach((element) => {
            nodeProSPLid.push(element);
          });
        }

        nodeProSPLid.forEach((element) => {
          if (!nodeSPLid.includes(element)) {
            delete flowNodesProperty[element];
          }
        });
      }

      result = {
        nodes: flowNodes,
        nodeProperty: flowNodesProperty,
        nodeEdges: flowNodeEdges,
      };

      let newVersion = 'v1';
      if (type === 'create') {
        let versionList = await this.getVersion(
          tenant,
          appGroup,
          fabrics,
          req.applicationName,
          req.artifact,
        );
        if (
          versionList &&
          versionList.status === 200 &&
          versionList.data &&
          versionList.data.length > 0
        ) {
          newVersion = `v${versionList.data.length + 1}`;
        }
      } else {
        newVersion = version;
      }

      Object.keys(result).forEach(async (key) => {
        await this.writeReddis(
          tenant +
            ':' +
            appGroup +
            ':' +
            req.applicationName +
            ':' +
            fabrics +
            ':' +
            req.artifact +
            ':' +
            newVersion +
            ':' +
            key,
          result[key],
        );
      });
      if (type === 'create') {
        let versions = await this.getVersion(
          tenant,
          appGroup,
          fabrics,
          req.applicationName,
          req.artifact,
        );
        if (versions && versions.status === 200) {
          return {
            status: 200,
            data: versions.data,
          };
        } else {
          return {
            status: 400,
            data: [],
          };
        }
      } else {
        return { msg: `${version} Updated`, status: 201 };
      }
    } catch (error) {
      return error;
    }
  }

  async getDefaultVersion() {
    const res = await this.redisService.getJsonData('UF:defaultJson');
    if (res) {
      const parsedData = JSON.parse(res);
      const keys = Object.keys(parsedData);
      const lastKey = keys[keys.length - 1];
      return parsedData[lastKey];
    } else {
      return null;
    }
  }

  async readReddis(tenant): Promise<any> {
    return await this.redisService.getJsonData(tenant);
  }

  async writeReddis(key, json): Promise<any> {
    await this.redisService.setJsonData(key, JSON.stringify(json));
  }
}
