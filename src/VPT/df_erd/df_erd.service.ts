import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../../redisService';

@Injectable()
export class DfErdService {
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

      let node = res['nodes'].map((node) => {
        if (
          res.hasOwnProperty('nodeProperty') &&
          res['nodeProperty'].hasOwnProperty(node.id)
        ) {
          return {
            ...node,
            data: {
              ...node.data,
              label: res['nodeProperty'][node.id].nodeName,
              nodeProperty: res['nodeProperty'][node.id],
            },
          };
        } else {
          return {
            ...node,
            data: {
              ...node.data,
              nodeProperty: {},
            },
          };
        }
      });

      res = {
        ...res,
        nodes: node,
      };

      console.log('🚀 ~ AppService ~ res:', res);
      return {
        data: res,
        status: 200,
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

  async getApplicationList(tenant, appGroup, fabrics): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      console.log(applications, 'appllllll');
      const response = [];
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        applications[tenant][appGroup].hasOwnProperty(fabrics) &&
        applications[tenant][appGroup][fabrics] &&
        typeof applications === 'object' &&
        Object.keys(applications[tenant]?.[appGroup]?.[fabrics]).length
      ) {
        const applicationName = Object.keys(
          applications[tenant][appGroup][fabrics],
        );

        if (applicationName) {
          for (let application of applicationName) {
            const artifactName = Object.keys(
              applications[tenant][appGroup][fabrics][application],
            );
            const artifactsDetails = [];
            for (const artifact of artifactName) {
              const version = Object.keys(
                applications[tenant][appGroup][fabrics][application][artifact],
              );

              artifactsDetails.push({
                artifact: artifact,
                version: version,
              });
            }
            response.push({
              application: application,
              artifact: artifactsDetails,
            });
          }
        }
      }
      console.table(response);
      return {
        data: response,
        status: 200,
      };
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
          data: response,
          status: 400,
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
      let nodes = structuredClone(req.flow.nodes);
      let edges = structuredClone(req.flow.nodeEdges);
      let updateResult = {};
      let result = {};

      let nodeProperty = {};

      nodes.forEach((element) => {
        nodeProperty[element.id] = element.data.nodeProperty;
      });

      nodeProperty = { ...this.RelationshipFlow(edges, nodes, nodeProperty) };

      result = {
        nodes: nodes,
        nodeProperty: nodeProperty,
        nodeEdges: edges,
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

      Object.keys(result).map(async (key) => {
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

  async readReddis(tenant): Promise<any> {
    return await this.redisService.getJsonData(tenant);
  }

  async writeReddis(key, json): Promise<any> {
    await this.redisService.setJsonData(key, JSON.stringify(json));
  }
  async getDefaultVersion() {
    const res = await this.redisService.getJsonData('DF:defaultJson');
    if (res) {
      const parsedData = JSON.parse(res);
      const keys = Object.keys(parsedData);
      const lastKey = keys[keys.length - 1];
      return parsedData[lastKey]?.nodeConfig;
    } else {
      return null;
    }
  }

  RelationshipFlow(edges, nodes, nodeConfig) {
    try {
      const processFlow = () => {
        const resultObj = { ...nodeConfig };
        if (edges.length == 0 || nodes.length > 0) {
          nodes.map((node) => {
            if (!resultObj[node.id])
              resultObj[node.id] = {
                nodeName: node.data.label,
                entities: {
                  Entity: node.data.label,
                  attributes: [],
                  methods: [],
                  relationships: [],
                },
              };
            else {
              resultObj[node.id] = {
                ...resultObj[node.id],
                nodeName: node.data.label,
                entities: {
                  ...resultObj[node.id].entities,
                  Entity: node.data.label,
                  relationships: [],
                },
              };
            }
          });
        }
        if (edges.length > 0) {
          edges.forEach((edge) => {
            const { source, target, sourceHandle, targetHandle } = edge;
            const sourceNode = nodes.find((node) => node.id === source);
            const targetNode = nodes.find((node) => node.id === target);

            resultObj[source] = {
              ...resultObj[source],

              entities: {
                ...resultObj[source]?.entities,
                relationships: [],
              },
            };

            let attributeSource = sourceHandle.split('-')[0];
            let attributeTarget = targetHandle.split('-')[0];
            const relationship = {
              Entities:
                sourceNode && targetNode
                  ? `${sourceNode.data.label},${targetNode.data.label}`
                  : 'N/A',
              Relationship: edge.data.startLabel + ',' + edge.data.endLabel,
              Coloumn:
                !isNaN(attributeSource) && !isNaN(attributeTarget)
                  ? `${resultObj[source].entities.attributes[attributeSource].cname},${resultObj[target].entities.attributes[attributeTarget].cname}`
                  : 'N/A',
            };

            resultObj[source].entities.relationships.push(relationship);
          });
        }

        // const updatedArray = Object.values(resultObj);

        return resultObj;
      };

      const processFlowResult = processFlow();
      console.log(processFlowResult, 'processFlowResult');

      return processFlowResult;
    } catch (error) {
      console.log(error);
    }
  }
}
