import { Injectable, BadRequestException } from '@nestjs/common';
import { RedisService } from 'src/redisService';

@Injectable()
export class UfdService {
  constructor(private readonly redisService: RedisService) {}

  async getJson(version, artifact, source, domain, fabrics): Promise<any> {
    try {
      let res = {
        nodes: [],
        nodeEdges: [],
        nodeProperty: [],
      };
      const nodes: Promise<any> = new Promise((resolve, reject) => {
        try {
          const node = this.readReddis(
            [source] +
              ':' +
              [domain] +
              ':' +
              [fabrics] +
              ':' +
              [artifact] +
              ':' +
              [version] +
              ':' +
              'nodes',
          );
          if (node !== null) resolve(node);
          else resolve([]);
        } catch (error) {
          reject(error);
        }
      });

      const nodeEdges: Promise<any> = new Promise((resolve, reject) => {
        try {
          const nodeEdge = this.readReddis(
            [source] +
              ':' +
              [domain] +
              ':' +
              [fabrics] +
              ':' +
              [artifact] +
              ':' +
              [version] +
              ':' +
              'nodeEdges',
          );
          if (nodeEdge !== null) resolve(nodeEdge);
          else resolve([]);
        } catch (error) {
          reject(error);
        }
      });

      const nodeProperty: Promise<any> = new Promise((resolve, reject) => {
        try {
          const property = this.readReddis(
            [source] +
              ':' +
              [domain] +
              ':' +
              [fabrics] +
              ':' +
              [artifact] +
              ':' +
              [version] +
              ':' +
              'nodeProperty',
          );
          if (property !== null) resolve(property);
          else resolve({});
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

      res = {
        nodes: JSON.parse(result[0]) || [],
        nodeEdges: JSON.parse(result[1]) || [],
        nodeProperty: JSON.parse(result[2]) || {},
      };
      console.log('🚀 ~ AppService ~ res:', res);
      return { status: 200, data: res };

      // const application = await JSON.parse(res);
      // console.log('🚀 ~ AppService ~ application:', application);
      // let applicationDetails = {};
      // if (domain === 'defaults') {
      //   applicationDetails = application[source];
      // } else {
      //   applicationDetails =
      //     application[source][domain][fabrics][applicationName][artifact][
      //       version
      //     ];
      // }
      // const configuration = {};
      // // if (fabrics === 'PF' && domain !== 'defaults') {
      // //   for (let keys in applicationDetails) {
      // //     if (keys !== 'artifact') {
      // //       configuration[keys] = applicationDetails[keys];
      // //     }
      // //   }
      // //   console.log('configuration --->', configuration);
      // //   console.log('applicationDetails --->', applicationDetails);
      // //   return {
      // //     workflow: { ...applicationDetails['artifact'] },
      // //     configuration: { ...configuration },
      // //   };
      // // }
      // if (fabrics === 'PF' && domain !== 'defaults') {
      //   // for (let keys in applicationDetails['nodeProperty']) {
      //   //   if (keys !== 'artifact' && keys !== 'processFlowSummary') {
      //   //     configuration[keys] = applicationDetails[keys];
      //   //   }
      //   // }
      //   console.log('configuration --->', configuration);
      //   console.log('applicationDetails --->', applicationDetails);
      //   return {
      //     nodes: applicationDetails['nodes'],
      //     nodeEdges: applicationDetails['nodeEdges'],
      //     nodeProperty: applicationDetails['nodeProperty'],
      //   };
      // }
      // if (fabrics === 'DF' && domain !== 'defaults') {
      //   return { workflow: { ...applicationDetails } };
      // }
    } catch (error) {
      throw error;
    }
  }
  async getDomain(source): Promise<any> {
    try {
      const res = await this.readReddis(source);
      const application = await JSON.parse(res);
      const response = [];
      if (
        application &&
        application.hasOwnProperty(source) &&
        Object.keys(application[source]).length &&
        typeof application === 'object'
      ) {
        const domainList = Object.keys(application[source]);

        if (domainList) {
          for (let domain of domainList) {
            response.push(domain);
          }
        }
        return {
          data: response,
          status: 200,
        };
      }
    } catch (error) {
      return {
        status: 500,
        message: 'Internal Server Error',
      };
    }
  }
  async getFabrics(source, domain): Promise<any> {
    try {
      const res = await this.readReddis(source);
      const applications = await JSON.parse(res);
      console.log(applications, 'appllllll');
      const response = [];
      if (
        applications &&
        applications.hasOwnProperty(source) &&
        applications[source].hasOwnProperty(domain) &&
        typeof applications === 'object'
      ) {
        const fabricsList = Object.keys(applications[source][domain]);

        if (fabricsList) {
          for (let fabrics of fabricsList) {
            const artifactName = Object.keys(
              applications[source][domain][fabrics],
            );
            const artifactsDetails = [];
            for (const artifact of artifactName) {
              artifactsDetails.push(artifact);
            }
            response.push({
              fabrics: fabrics,
              artifacts: artifactsDetails,
            });
          }
        }
      }

      return {
        status: 200,
        data: response,
      };
    } catch (error) {
      throw error;
    }
  }

  async getArtifact(source, domain, fabrics): Promise<any> {
    try {
      const res = await this.readReddis(source);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(source) &&
        applications[source].hasOwnProperty(domain) &&
        applications[source][domain].hasOwnProperty(fabrics) &&
        applications[source][domain][fabrics] &&
        typeof applications === 'object' &&
        Object.keys(applications[source]?.[domain]?.[fabrics]).length
      ) {
        const artifactName = Object.keys(applications[source][domain][fabrics]);

        // const artifactsDetails = [];
        // for (const artifact of artifactName) {
        //   const version = applications[source][domain][fabrics][artifact];

        //   artifactsDetails.push({
        //     artiFactsList: artifact,
        //     version: version,
        //   });
        // }

        return {
          status: 200,
          data: artifactName,
        };
      }
      throw new BadRequestException('Application Not Found');
    } catch (error) {
      throw error;
    }
  }

  async getVersion(source, domain, fabrics, artifact): Promise<any> {
    try {
      const res = await this.readReddis(source);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(source) &&
        applications[source].hasOwnProperty(domain) &&
        applications[source][domain][fabrics].hasOwnProperty(artifact) &&
        typeof applications === 'object' &&
        Object.keys(applications[source]?.[domain]?.[fabrics]).length
      ) {
        const version = applications[source][domain][fabrics][artifact].version;
        const mode = applications[source][domain][fabrics][artifact].mode;
        return {
          status: 200,
          data: {
            version: version,

            mode: mode,
          },
        };
      }
    } catch (error) {
      throw error;
    }
  }
  async saveaWorkFlow(
    req: any,
    type: string,
    version: any,
    source: string,
    domain: string,
    fabrics: string,
  ): Promise<any> {
    try {
      let updateResult = {};
      let result = {};
   
        const nodes = structuredClone(req.flow.nodes);
        const edges = structuredClone(req.flow.nodeEdges);



        result = {
          nodes: nodes,
          nodeEdges: edges,
          nodeProperty: nodes.reduce((acc, node) => {
            if (Object.keys(node.data.nodeProperty).length > 0) {
              acc[node.id] = node.data.nodeProperty;
            }
            return acc;
          }, {}),
        };

        updateResult = {
          nodes: nodes,
          nodeEdges: edges,
          nodeProperty: nodes.reduce((acc, node) => {
            if (Object.keys(node.data.nodeProperty).length > 0) {
              acc[node.id] = node.data.nodeProperty;
            }
            return acc;
          }, {}),
        };
      
      if (type === 'create') {
        const res = await this.readReddis(source);
        const applications: object = await JSON.parse(res);

        if (
          applications &&
          applications.hasOwnProperty(source) &&
          applications[source].hasOwnProperty(domain) &&
          applications[source][domain].hasOwnProperty(fabrics) &&
          typeof applications === 'object' &&
          Object.keys(applications[source][domain][fabrics]).length
        ) {
          const application = { ...applications };

          let version: string;
          if (
            application[source][domain][fabrics].hasOwnProperty(req.artifact)
          ) {
            version = `v${
              Object.keys(
                applications[source][domain][fabrics][req.artifact].version,
              ).length + 1
            }`;
            applications[source][domain][fabrics][req.artifact] = {
              ...applications[source][domain][fabrics][req.artifact],
              mode: req.mode,
              version: [
                ...applications[source][domain][fabrics][req.artifact].version,
                version,
              ],
            };
          } else {
            version = `v1`;
            applications[source][domain][fabrics] = {
              ...applications[source][domain][fabrics],
              [req.artifact]: { version: [version], mode: req.mode },
            };
          }
          console.log(
            'application exists-->',
            JSON.stringify(application),
            source,
          );
          await this.writeReddis(source, application);

          Object.keys(result).map(async (key) => {
            await this.writeReddis(
              source +
                ':' +
                domain +
                ':' +
                fabrics +
                ':' +
                req.artifact +
                ':' +
                version +
                ':' +
                key,
              updateResult[key],
            );
          });

          const versions =
            application[source][domain][fabrics][req.artifact].version;

          //   const appw = structuredClone(application);

          // await this.createRedisFiles(appw, '', 1);
          return {
            msg: 'New Application Created',
            data: versions,
            status: 200,
          };
          //  else {
          //             const version = `v1`;
          //             applications[source][domain][fabrics]  = {
          //               ...applications[source][domain][fabrics] ,
          //               [req.artifact]: [version],
          //             };
          //             console.log(
          //               'application exists-->',
          //               JSON.stringify(application),
          //               source,
          //             );
          //             await this.writeReddis(source, application);

          //             Object.keys(result).map(async (key) => {
          //               await this.writeReddis(
          //                 source +
          //                   ':' +
          //                   domain +
          //                   ':' +
          //                   fabrics +
          //                   ':' +
          //                   req.applicationName +
          //                   ':' +
          //                   req.artifact +
          //                   ':' +
          //                   version +
          //                   ':' +
          //                   key,
          //                 result[key],
          //               );
          //             });
          //             const versions =
          //               application[source][domain][fabrics] [
          //                 req.artifact
          //               ];

          //             // const appw = structuredClone(application);

          //             // await this.createRedisFiles(appw, '', 1);

          //             return {
          //               msg: 'New Version Created',
          //               versions: versions,
          //               status: 200,
          //             };
          //           }
        } else {
          const res = await this.readReddis(source);
          let application = { ...(await JSON.parse(res)) };

          console.log(
            application,
            'outside',
            source,
            domain,
            fabrics,
            req.applicationName,
            req.artifact,
          );
          let appl = structuredClone(application);
          const version = `v1`;
          if (!appl.hasOwnProperty(source)) {
            appl = {
              ...appl,
              [source]: {},
            };
          }
          if (!appl[source].hasOwnProperty(domain)) {
            appl[source] = { ...appl[source], [domain]: {} };
          }
          if (!appl[source][domain].hasOwnProperty(fabrics)) {
            appl[source][domain] = {
              ...appl[source][domain],
              [fabrics]: {},
            };
          }

          appl[source][domain][fabrics] = {
            [req.artifact]: { version: [version], mode: req.mode },
          };
          Object.keys(result).map(async (key) => {
            await this.writeReddis(
              source +
                ':' +
                domain +
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
          console.log('application created-->', appl, source);
          await this.writeReddis(source, appl);

          const versions = appl[source][domain][fabrics][req.artifact].version;

          return {
            msg: 'New Application Created',
            data: versions,
            status: 200,
          };
        }
      }

      if (type === 'update') {
        const res = await this.readReddis(source);
        const applications: any = await JSON.parse(res);
        console.log('redis-->', JSON.stringify(applications), source);
        const application = { ...applications };

        // applications[source][domain][fabrics][req.applicationName][
        //   req.artifact
        // ] = {
        //   ...applications[source][domain][fabrics][req.applicationName][
        //     req.artifact
        //   ],
        //   [version]: {
        //     ...applications[source][domain][fabrics][req.applicationName][
        //       req.artifact
        //     ][version],
        //     ...updateResult,
        //   },
        // };
        Object.keys(updateResult).map(async (key) => {
          await this.writeReddis(
            source +
              ':' +
              domain +
              ':' +
              fabrics +
              ':' +
              req.artifact +
              ':' +
              version +
              ':' +
              key,
            updateResult[key],
          );
        });
        console.log(
          'application exists-->',
          JSON.stringify(application),
          source,
        );
        await this.writeReddis(source, application);
        // const appw = structuredClone(application);

        // await this.createRedisFiles(appw, '', 1);

        return { msg: `${version} Updated`, status: 201 };
      }
    } catch (error) {
      return error;
    }
  }

  async readReddis(source): Promise<any> {
    return await this.redisService.getJsonData(source);
  }

  async writeReddis(key, json): Promise<any> {
    await this.redisService.setJsonData(key, JSON.stringify(json));
  }






}
