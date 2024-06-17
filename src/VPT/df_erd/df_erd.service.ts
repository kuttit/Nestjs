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
              label : res['nodeProperty'][node.id].nodeName,
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
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        applications[tenant][appGroup].hasOwnProperty(applicationName) &&
        applications[tenant][appGroup][applicationName] &&
        applications[tenant][appGroup][applicationName].hasOwnProperty(
          fabrics,
        ) &&
        typeof applications === 'object' &&
        Object.keys(applications[tenant]?.[appGroup]?.[applicationName]).length
      ) {
        const artifactName = Object.keys(
          applications[tenant][appGroup][applicationName][fabrics],
        );

        // const artifactsDetails = [];
        // for (const artifact of artifactName) {
        //   const version =
        //     applications[tenant][appGroup][applicationName][fabrics][artifact];

        //   artifactsDetails.push({
        //     artiFactsList: artifact,
        //     version: version,
        //   });
        // }

        return {
          data: artifactName,
          status: 200,
        };
      }
      throw new BadRequestException('Application Not Found');
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
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        applications[tenant][appGroup].hasOwnProperty(applicationName) &&
        applications[tenant][appGroup][applicationName] &&
        applications[tenant][appGroup][applicationName].hasOwnProperty(
          fabrics,
        ) &&
        applications[tenant][appGroup][applicationName][fabrics].hasOwnProperty(
          artifact,
        ) &&
        typeof applications === 'object' &&
        Object.keys(applications[tenant]?.[appGroup]?.[applicationName]).length
      ) {
        const version =
          applications[tenant][appGroup][applicationName][fabrics][artifact];
        return {
          data: version,
          status: 200,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getRedisAll(tenants) {
    let newObj = {};
    for (let index = 0; index < tenants.length; index++) {
      const element = tenants[index];
      const res = await this.readReddis(element);
      console.log('🚀 ~ AppService ~ getRedisAll ~ res:', res);
      let tenantJson: any = await JSON.parse(res);
      console.log(tenantJson, 'tenantJsontenantJsontenantJson');
      if (tenantJson && Object.keys(tenantJson).length > 0) {
        newObj = { ...newObj, ...tenantJson };
        console.log(tenantJson, 'hjhjhjhgh');
      }
    }

    return newObj;
  }

  // async getPathsAndCreateFolders(obj, currentPath = '', interator) {
  //   let paths = [];

  //   for (const key in obj) {
  //     if (obj.hasOwnProperty(key)) {
  //       const newPath = `${currentPath}/${key}`;
  //       paths.push(newPath);

  //       if (typeof obj[key] === 'object' && obj[key] !== null) {
  //         if (interator <= 6) {
  //           if (interator === 1 && fs.existsSync(`./${newPath}`)) {
  //             await fs.rmSync(`./${newPath}`, {
  //               recursive: true,
  //               force: true,
  //             });
  //           }
  //           fs.mkdirSync(`./${newPath}`);
  //           paths = paths.concat(
  //             await this.getPathsAndCreateFolders(
  //               obj[key],
  //               newPath,
  //               interator + 1,
  //             ),
  //           );
  //         } else {
  //           fs.writeFileSync(`./${newPath}.json`, JSON.stringify(obj[key]));
  //         }
  //       } else if (typeof obj[key] === 'string' && obj[key] !== null) {
  //         fs.writeFileSync(`./${newPath}.txt`, obj[key]);
  //       }
  //     }
  //   }
  //   return paths;
  // }

  async createRedisFiles(obj, currentPath = '', interator) {
    let path = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newPath = `${currentPath}:${key}`;
        path.push(newPath);

        if (typeof obj[key] == 'object' && obj[key] !== null) {
          if (interator <= 6) {
            path = path.concat(
              await this.createRedisFiles(obj[key], newPath, interator + 1),
            );
          } else {
            let arr = newPath.split(':');
            arr.shift();
            const kes = arr.join(':');
            console.log(kes, 'key');
            await this.writeReddis(kes, obj[key]);
          }
        }
      }
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

      updateResult = {
        nodes: nodes,
        nodeProperty: nodeProperty,
        nodeEdges: edges,
      };

      // let nodeSPLid = [];
      // let nodeProSPLid = [];

      // let flowNodes = structuredClone(req.flow.nodes);
      // let flowNodesProperty = structuredClone(req.flow.nodeProperty);
      // let flowNodeEdges = req.flow.nodeEdges;
      // if (Object.keys(flowNodes).length > 0) {
      //   flowNodes.forEach((element) => {
      //     nodeSPLid.push(element.id);
      //   });

      //   if (typeof flowNodesProperty === 'object') {
      //     Object.keys(flowNodesProperty).forEach((element) => {
      //       nodeProSPLid.push(element);
      //     });
      //   }

      //   nodeProSPLid.forEach((element) => {
      //     if (!nodeSPLid.includes(element)) {
      //       delete flowNodesProperty[element];
      //     }
      //   });
      // }

      // result = {
      //   nodes: flowNodes,
      //   nodeProperty: flowNodesProperty,
      //   nodeEdges: flowNodeEdges,
      // };

      // updateResult = {
      //   nodes: flowNodes,
      //   nodeProperty: flowNodesProperty,
      //   nodeEdges: flowNodeEdges,
      // };
      if (type === 'create') {
        const res = await this.readReddis(tenant);
        const applications: object = await JSON.parse(res);

        if (
          applications &&
          applications.hasOwnProperty(tenant) &&
          applications[tenant].hasOwnProperty(appGroup) &&
          applications[tenant][appGroup].hasOwnProperty(req.applicationName) &&
          typeof applications === 'object' &&
          Object.keys(applications[tenant][appGroup][req.applicationName])
            .length
        ) {
          const application = { ...applications };

          if (
            application[tenant][appGroup][req.applicationName].hasOwnProperty(
              fabrics,
            )
          ) {
            let version: string;
            if (
              application[tenant][appGroup][req.applicationName][
                fabrics
              ].hasOwnProperty(req.artifact)
            ) {
              version = `v${
                Object.keys(
                  applications[tenant][appGroup][req.applicationName][fabrics][
                    req.artifact
                  ],
                ).length + 1
              }`;
              applications[tenant][appGroup][req.applicationName][fabrics][
                req.artifact
              ] = [
                ...applications[tenant][appGroup][req.applicationName][fabrics][
                  req.artifact
                ],
                version,
              ];
            } else {
              version = `v1`;
              applications[tenant][appGroup][req.applicationName][fabrics] = {
                ...applications[tenant][appGroup][req.applicationName][fabrics],
                [req.artifact]: [version],
              };
            }
            console.log(
              'application exists-->',
              JSON.stringify(application),
              tenant,
            );
            await this.writeReddis(tenant, application);

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
                  version +
                  ':' +
                  key,
                result[key],
              );
            });

            const versions =
              application[tenant][appGroup][req.applicationName][fabrics][
                req.artifact
              ];

            const appw = structuredClone(application);

            // await this.createRedisFiles(appw, '', 1);
            return {
              msg: 'New Application Created',
              data: versions,
              status: 200,
            };
          } else {
            const version = `v1`;
            applications[tenant][appGroup][req.applicationName][fabrics] = {
              ...applications[tenant][appGroup][req.applicationName][fabrics],
              [req.artifact]: [version],
            };
            console.log(
              'application exists-->',
              JSON.stringify(application),
              tenant,
            );
            await this.writeReddis(tenant, application);
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
                  version +
                  ':' +
                  key,
                result[key],
              );
            });

            const versions =
              application[tenant][appGroup][req.applicationName][fabrics][
                req.artifact
              ];

            // const appw = structuredClone(application);

            // await this.createRedisFiles(appw, '', 1);

            return {
              msg: 'New Version Created',
              data: versions,
              status: 200,
            };
          }
        } else {
          const res = await this.readReddis(tenant);
          let application = { ...(await JSON.parse(res)) };

          console.log(
            application,
            'outside',
            tenant,
            appGroup,
            fabrics,
            req.applicationName,
            req.artifact,
          );
          let appl = structuredClone(application);
          const version = `v1`;
          if (!appl.hasOwnProperty(tenant)) {
            appl = {
              ...appl,
              [tenant]: {},
            };
          }
          if (!appl[tenant].hasOwnProperty(appGroup)) {
            appl[tenant] = { ...appl[tenant], [appGroup]: {} };
          }
          if (!appl[tenant][appGroup].hasOwnProperty(req.applicationName)) {
            appl[tenant][appGroup] = {
              ...appl[tenant][appGroup],
              [req.applicationName]: {},
            };
          }

          if (
            !appl[tenant][appGroup][req.applicationName].hasOwnProperty(fabrics)
          ) {
            appl[tenant][appGroup][req.applicationName] = {
              ...appl[tenant][appGroup][req.applicationName],
              [fabrics]: {},
            };
          }

          appl[tenant][appGroup][req.applicationName][fabrics] = {
            ...appl[tenant][appGroup][req.applicationName][fabrics],
            [req.artifact]: [version],
          };
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
                version +
                ':' +
                key,
              result[key],
            );
          });
          console.log('application created-->', appl, tenant);
          await this.writeReddis(tenant, appl);
          // const appw = structuredClone(appl);

          // await this.createRedisFiles(appw, '', 1);
          const versions =
            appl[tenant][appGroup][req.applicationName][fabrics][req.artifact];

          return {
            msg: 'New Application Created',
            data: versions,
            status: 200,
          };
        }
      }

      if (type === 'update') {
        const res = await this.readReddis(tenant);
        const applications: any = await JSON.parse(res);
        console.log('redis-->', JSON.stringify(applications), tenant);
        const application = { ...applications };

        // applications[tenant][appGroup][fabrics][req.applicationName][
        //   req.artifact
        // ] = {
        //   ...applications[tenant][appGroup][fabrics][req.applicationName][
        //     req.artifact
        //   ],
        //   [version]: {
        //     ...applications[tenant][appGroup][fabrics][req.applicationName][
        //       req.artifact
        //     ][version],
        //     ...updateResult,
        //   },
        // };
        Object.keys(updateResult).map(async (key) => {
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
              version +
              ':' +
              key,
            result[key],
          );
        });
        console.log(
          'application exists-->',
          JSON.stringify(application),
          tenant,
        );
        await this.writeReddis(tenant, application);
        // const appw = structuredClone(application);

        // await this.createRedisFiles(appw, '', 1);

        return { msg: `${version} Updated`, status: 201 };
      }
    } catch (error) {
      return error;
    }
  }

  async tenantDetails() {
    try {
      // const saveOptions = save_options;
      return {
     
      };
    } catch (error) {
      throw error;
    }
  }

  async controlpolicy(nodeType: any) {
    try {
      // const configControlpolicy = config_controlpolicy;
      // const workflowControlpolicy = workflow_controlpolicy;
      // const configColorpolicy = config_colorpolicy;
      // const workflowColorpolicy = workflow_colorpolicy;

      return {
       
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserRoleDetails(roleId) {
    try {
      // const READ_ONLY = read_only;
      // const ADMIN = admin;
      // const DEVELOPER = developer;
      // let response = null;
      // switch (roleId) {
      //   case READ_ONLY:
      //     response = { statusCode: 200, roleType: 'READ_ONLY' };
      //     break;
      //   case ADMIN:
      //     response = { statusCode: 200, roleType: 'ADMIN' };
      //     break;
      //   case DEVELOPER:
      //     response = { statusCode: 200, roleType: 'DEVELOPER' };
      //     break;
      //   default:
      //     response = { statusCode: 400, roleType: null };
      //     break;
      // }
      return {};
    } catch (error) {
      throw error;
    }
  }

  // createVersionFolder(req, version) {
  //   console.log('createVersionFolder');
  //   fs.mkdirSync(
  //     `${app_pfd_path}/${req.applicationName}/${req.processFlow}/v${version}`,
  //     (err) => {
  //       // console.log(err);
  //     },
  //   );
  //   console.log('createVersionFolder-END');
  // }
  // createWorkFlow(req, folderVersion) {
  //   console.log('createWorkFlow');
  //   try {
  //     fs.writeFileSync(
  //       `${app_pfd_path}/${req.applicationName}/${req.processFlow}/v${folderVersion}/processflow.json`,
  //       JSON.stringify(req.workFlow),
  //     );
  //   } catch (error) {
  //     return error;
  //   }
  //   console.log('createWorkFlow-END');
  // }
  // createConfiqureFile(req, folderVersion) {
  //   try {
  //     const keys = Object.keys(req.configuration);
  //     for (let configure of keys) {
  //       fs.writeFileSync(
  //         `${app_pfd_path}/${req.applicationName}/${req.processFlow}/v${folderVersion}/${configure}.json`,
  //         JSON.stringify(req.configuration[configure]),
  //       );
  //     }
  //   } catch (error) {
  //     return error;
  //   }
  // }

  applicationDetails() {
    try {
      return {  };
    } catch (error) {
      throw error;
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
                  attributes: node.defaults.attributesDefaults.attributes,
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

            if (!resultObj[source]) {
              resultObj[source] = {
                nodeName: sourceNode.data.label,
                entities: {
                  Entity: sourceNode.data.label,
                  attributes:
                    sourceNode?.defaults.attributesDefaults.attributes || [],
                  methods: [],
                  relationships: [],
                },
              };
            }
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

      // const copyOfprocessFlowResult = structuredClone(processFlowResult);
      // let entityJsonNames = [];
      // Object.values(processFlowResult).map((entity) => {
      //   if (!entityJsonNames.includes(entity.Entity)) {
      //     entityJsonNames.push(entity.Entity);
      //   }
      // });

      // nodes.map((node) => {
      //   if (!entityJsonNames.includes(node.data.label)) {
      //     copyOfprocessFlowResult[node.id] = {
      //       Entity: node.data.label,
      //       attributes: node.defaults.attributesDefaults.attributes,
      //       methods: [],
      //       relationships: [],
      //     };
      //   }
      // });

      return processFlowResult;
    } catch (error) {
      console.log(error);
    }
  }
}
