import { HttpService } from '@nestjs/axios';
import { PfdService } from './pfd/pfd.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

import { RedisService } from 'src/redisService';
import { ZenEngine } from '@gorules/zen-engine';

@Injectable()
export class VptService {
  constructor(
    private readonly redisService: RedisService,
    private readonly pfdService: PfdService,
    private readonly httpService: HttpService,
  ) {}

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
      throw error;
    }
  }
  async createDomain(source, domain): Promise<any> {
    try {
      const res = await this.readReddis(source);
      const application = await JSON.parse(res);
      if (
        application &&
        application.hasOwnProperty(source) &&
        typeof application === 'object'
      ) {
        if (application[source].hasOwnProperty(domain)) {
          throw new BadRequestException('Domain Already Exist');
        } else {
          application[source][domain] = {};
          await this.writeReddis(source, application);
          let res = [];
          let domainList = Object.keys(application[source]);

          if (domainList) {
            for (let domain of domainList) {
              res.push(domain);
            }
          }

          return {
            data: res,
            status: 200,
          };
        }
      }
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

  async createAppGroup(tenant, appGroup): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      let application = await JSON.parse(res);
      if (
        application &&
        application.hasOwnProperty(tenant) &&
        typeof application === 'object'
      ) {
        if (application[tenant].hasOwnProperty(appGroup)) {
          throw new BadRequestException('AppGroup Already Exist');
        } else {
          application[tenant][appGroup] = {};
          await this.writeReddis(tenant, application);
          let res = [];
          let appGroupList = Object.keys(application[tenant]);
          if (appGroupList) {
            for (let appGroup of appGroupList) {
              res.push(appGroup);
            }
          }
          return {
            data: res,
            status: 200,
          };
        }
      } else {
        application = {
          [tenant]: {
            [appGroup]: {},
          },
        };
        await this.writeReddis(tenant, application);
        let res = [];
        let appGroupList = Object.keys(application[tenant]);
        if (appGroupList) {
          for (let appGroup of appGroupList) {
            res.push(appGroup);
          }
        }
        return {
          data: res,
          status: 200,
        };
      }
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

  async createApplication(tenant, appGroup, application): Promise<any> {
    try {
      const res = await this.readReddis(tenant);

      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        typeof applications === 'object'
      ) {
        if (applications[tenant][appGroup].hasOwnProperty(application)) {
          return {
            status: 400,
            message: 'Application Already Exist',
          };
        } else {
          applications[tenant][appGroup] = {
            ...applications[tenant][appGroup],

            [application]: {},
          };
          await this.writeReddis(tenant, applications);
          let res = [];

          let applicationlist = Object.keys(applications[tenant][appGroup]);
          for (let application of applicationlist) {
            res.push(application);
          }

          return {
            status: 200,
            message: 'Application Created',
            data: res,
          };
        }
      } else {
        return {
          status: 400,
          message: 'Application Already Exist',
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteDomain(source, domain): Promise<any> {
    try {
      const res = await this.readReddis(source);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(source) &&
        applications[source].hasOwnProperty(domain) &&
        typeof applications === 'object'
      ) {
        delete applications[source][domain];
        await this.delete(source + ':' + domain);
        await this.writeReddis(source, applications);

        let domainList = Object.keys(applications[source]);
        return {
          status: 200,
          data: domainList,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteDefaultArtifact(source, domain, fabrics, artifact): Promise<any> {
    try {
      const res = await this.readReddis(source);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(source) &&
        applications[source].hasOwnProperty(domain) &&
        applications[source][domain].hasOwnProperty(fabrics) &&
        applications[source][domain][fabrics].hasOwnProperty(artifact) &&
        typeof applications === 'object'
      ) {
        delete applications[source][domain][fabrics][artifact];
        await this.delete(
          source + ':' + domain + ':' + fabrics + ':' + artifact,
        );
        await this.writeReddis(source, applications);
        const artifactList = Object.keys(applications[source][domain][fabrics]);
        return {
          status: 200,
          data: artifactList,
        };
      } else {
        return {
          status: 400,
          data: [],
          message: 'Artifact Not Found',
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteDefaultVersion(
    source,
    domain,
    fabrics,
    artifact,
    version,
  ): Promise<any> {
    try {
      const res = await this.readReddis(source);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(source) &&
        applications[source].hasOwnProperty(domain) &&
        applications[source][domain].hasOwnProperty(fabrics) &&
        applications[source][domain][fabrics].hasOwnProperty(artifact) &&
        typeof applications === 'object'
      ) {
        applications[source][domain][fabrics][artifact] = {
          ...applications[source][domain][fabrics][artifact],
          version: [
            ...applications[source][domain][fabrics][artifact].version.filter(
              (ver) => ver !== version,
            ),
          ],
        };
        await this.delete(
          source +
            ':' +
            domain +
            ':' +
            fabrics +
            ':' +
            artifact +
            ':' +
            version,
        );
        await this.writeReddis(source, applications);
        const versionList =
          applications[source][domain][fabrics][artifact].version;
        return {
          status: 200,
          data: versionList,
        };
      } else {
        return {
          status: 400,
          data: [],
          message: 'Version Not Found',
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteAppGroup(tenant, appGroup): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        typeof applications === 'object'
      ) {
        delete applications[tenant][appGroup];
        await this.delete(tenant + ':' + appGroup);
        await this.writeReddis(tenant, applications);
        let appGroupList = Object.keys(applications[tenant]);
        return {
          status: 200,
          data: appGroupList,
          message: 'AppGroup Deleted Successfully',
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async customCodeExcute(code): Promise<any> {
    try {
      const body = {
        language: 'javascript',
        version: '18.15.0',
        files: [
          {
            content: code,
          },
        ],
      };
      const data = await fetch('http://192.168.2.165:2000/api/v2/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(body),
      }).then((res) => {
        return res.json();
      });
      // let datas = await this.httpService.post(
      //   'http://192.168.2.165:2000/api/v2/execute',
      //   {
      //     language: 'javascript',
      //     version: '18.15.0',
      //     files: [
      //       {
      //         content: code,
      //       },
      //     ],
      //   },
      //   {
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //   },
      // );
      let result = data;
      console.log(result);
      return {
        status: 200,
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteApplication(tenant, appGroup, application): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        applications[tenant][appGroup].hasOwnProperty(application) &&
        typeof applications === 'object'
      ) {
        delete applications[tenant][appGroup][application];
        await this.delete(tenant + ':' + appGroup + ':' + application);
        await this.writeReddis(tenant, applications);
        let applicationList = Object.keys(applications[tenant][appGroup]);
        return {
          status: 200,
          data: applicationList,
          message: 'Application Deleted Successfully',
        };
      } else {
        return {
          status: 400,
          data: [],
          message: 'Application Not Found',
        };
      }
    } catch (error) {
      return {
        status: 400,
        data: [],
        message: 'Application Not Found',
      };
    }
  }

  async deleteFlowArtifact(
    tenant,
    appGroup,
    application,
    fabrics,
    artifact,
  ): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        applications[tenant][appGroup].hasOwnProperty(application) &&
        applications[tenant][appGroup][application].hasOwnProperty(fabrics) &&
        applications[tenant][appGroup][application][fabrics].hasOwnProperty(
          artifact,
        ) &&
        typeof applications === 'object'
      ) {
        delete applications[tenant][appGroup][application][fabrics][artifact];
        await this.delete(
          tenant +
            ':' +
            appGroup +
            ':' +
            application +
            ':' +
            fabrics +
            ':' +
            artifact,
        );
        await this.writeReddis(tenant, applications);
        let artifactList = Object.keys(
          applications[tenant][appGroup][application][fabrics],
        );
        return {
          status: 200,
          data: artifactList,
          message: 'Artifact Deleted Successfully',
        };
      } else {
        return { status: 400, data: {}, message: 'Artifact Not Found' };
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteFlowVersion(
    tenant,
    appGroup,
    application,
    fabrics,
    artifact,
    version,
  ) {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        applications[tenant][appGroup].hasOwnProperty(application) &&
        applications[tenant][appGroup][application].hasOwnProperty(fabrics) &&
        applications[tenant][appGroup][application][fabrics].hasOwnProperty(
          artifact,
        ) &&
        typeof applications === 'object'
      ) {
        let versionList = [];
        if (
          !Array.isArray(
            applications[tenant][appGroup][application][fabrics][artifact],
          )
        ) {
          delete applications[tenant][appGroup][application][fabrics][artifact][
            version
          ];
          versionList = Object.keys(
            applications[tenant][appGroup][application][fabrics][artifact],
          );
        } else {
          applications[tenant][appGroup][application][fabrics][artifact] = [
            ...applications[tenant][appGroup][application][fabrics][
              artifact
            ].filter((v) => v !== version),
          ];
          versionList =
            applications[tenant][appGroup][application][fabrics][artifact];
        }

        await this.delete(
          tenant +
            ':' +
            appGroup +
            ':' +
            application +
            ':' +
            fabrics +
            ':' +
            artifact +
            ':' +
            version,
        );
        await this.writeReddis(tenant, applications);

        return {
          status: 200,
          data: versionList,
          message: 'Version Deleted Successfully',
        };
      } else {
        return {
          status: 400,
          data: [],
          message: 'Version Not Found',
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async delete(key): Promise<any> {
    try {
      let allKeys = await this.redisService.getKeys(key);

      for (let i = 0; i < allKeys.length; i++) {
        console.log('Deleting Key : ' + allKeys[i]);
        await this.redisService.deleteKey(allKeys[i]);
      }
    } catch (error) {
      throw error;
    }
  }

  async getDefaultVersion(source, domain, fabrics, artifact): Promise<any> {
    try {
      const res = await this.readReddis(source);
      const applications = await JSON.parse(res);
      const version = applications[source][domain][fabrics][artifact].version;
      const latestVersion = version[version.length - 1];
      const versionData = await this.pfdService.getJson(
        latestVersion,
        artifact,
        source,
        domain,
        fabrics,
      );
      return {
        status: 200,
        data: versionData?.data,
      };
    } catch (error) {
      return {
        status: 400,
        data: {},
      };
    }
  }

  async readReddis(source): Promise<any> {
    return await this.redisService.getJsonData(source);
  }

  async writeReddis(key, json): Promise<any> {
    await this.redisService.setJsonData(key, JSON.stringify(json));
  }

  async getTreeFabrics(tenant): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      let treeList: any;
      function traverse(applications, i: number) {
        let treeLists = i == 2 ? [] : {};
        if (i < 2) {
          if (Object.keys(applications).length > 0) {
            Object.keys(applications).map((tenant) => {
              treeLists[tenant] = traverse(applications[tenant], i + 1);
            });
          } else {
            treeLists = {};
          }
        } else {
          if (Object.keys(applications).length > 0) {
            treeLists = [...Object.keys(applications)];
          } else {
            treeLists = [];
          }
        }

        return treeLists;
      }

      treeList = traverse(applications, 0);
      return {
        status: 200,
        data: treeList,
        message: 'Success',
      };
    } catch (error) {
      throw error;
    }
  }

  async getPF(input) {
    try {
      var key = input.key;
      var nName = input.nodeName;
      var ncode = input.savedCode;
      const json = await this.redisService.getJsonData(key + 'processFlow');
      var pfjson: any = JSON.parse(json);
      var result = await this.getRedisPH(key, pfjson, nName, ncode);
      return result;
    } catch (err) {
      throw err;
    }
  }

  async getRedisPH(json, key, nName, ncode) {
    var arr = [];
    var nodeid;

    for (var k = 0; k < key.length; k++) {
      // Start Node

      if (key[k].nodeName == 'Start') {
        var obj = {};
        obj['nodeid'] = key[k].nodeId;
        obj['nodename'] = key[k].nodeName;
        obj['nodetype'] = key[k].nodeType;
        arr.push(obj);
        nodeid = key[k].routeArray[0].nodeId;
      }

      if (
        nodeid == key[k].nodeId &&
        key[k].nodeType == 'humantasknode' &&
        (key[k].nodeName != 'Start' || key[k].nodeName != 'End')
      ) {
        if (nName == key[k].nodeName) {
          var response = await this.getJson(json, arr, nName);
          return response;
        } else {
          var obj = {};
          obj['nodeid'] = key[k].nodeId;
          obj['nodename'] = key[k].nodeName;
          obj['nodetype'] = key[k].nodeType;
          arr.push(obj);
          //Get manualinput by client rwquest from redis

          nodeid = key[k].routeArray[0].nodeId;
          //To set these params to next node request
        }
      }

      // Decision Node

      if (
        nodeid == key[k].nodeId &&
        key[k].nodeType == 'decisionnode' &&
        (key[k].nodeName != 'Start' || key[k].nodeName != 'End')
      ) {
        if (nName == key[k].nodeName) {
          var response = await this.getJson(json, arr, nName);
          return response;
        } else {
          var obj = {};
          obj['nodeid'] = key[k].nodeId;
          obj['nodename'] = key[k].nodeName;
          obj['nodetype'] = key[k].nodeType;
          arr.push(obj);

          var wfarr = JSON.parse(
            await this.redisService.getJsonDataWithPath(
              json + 'nodeProperty',
              '.' + key[k].nodeId + '.rule',
            ),
          );
          var gparamreq = {};
          var greq = JSON.parse(
            await this.redisService.getJsonDataWithPath(
              json + 'nodeProperty',
              '.' + key[k].nodeId + '.rule..inputs',
            ),
          );
          for (var g = 0; g < greq.length; g++) {
            var decreq = JSON.parse(
              await this.redisService.getJsonDataWithPath(
                json + 'nodeProperty',
                '.' +
                  key[k].nodeId +
                  '.data.pro.request' +
                  '..' +
                  greq[g].field,
              ),
            );
            gparamreq[greq[g].field] = decreq;
          }

          /*Retrieves the rule, form the input data to check
            & sends to the rule engine to evaluate
        */

          var goruleres = await this.goRule(wfarr, gparamreq);
          var wfres = goruleres.result.output;
          for (var w = 0; w < key[k].routeArray.length; w++) {
            // check the rule engine result with process flow result of identification of next node
            if (key[k].routeArray[w].conditionResult == wfres) {
              nodeid = key[k].routeArray[w].nodeId;
              break;
            }
          }
        }
      }

      // Api Node
      if (
        nodeid == key[k].nodeId &&
        key[k].nodeType == 'apinode' &&
        key[k].nodeName != 'Start' &&
        key[k].nodeName != 'End'
      ) {
        if (nName == key[k].nodeName) {
          var response = await this.getJson(json, arr, nName);
          return response;
        } else {
          var obj = {};
          obj['nodeid'] = key[k].nodeId;
          obj['nodename'] = key[k].nodeName;
          obj['nodetype'] = key[k].nodeType;
          arr.push(obj);
          nodeid = key[k].routeArray[0].nodeId;
        }
      }

      // End Node

      if (key[k].nodeName == 'End') {
        var obj = {};
        obj['nodeid'] = key[k].nodeId;
        obj['nodename'] = key[k].nodeName;
        obj['nodetype'] = key[k].nodeType;
        arr.push(obj);
        break;
      }
    }
  }

  async getJson(input, arr, nname) {
    var obj = {};
    for (var s = 0; s < arr.length; s++) {
      if (arr[s].nodename != 'Start' && arr[s].nodename != 'End') {
        const apikey = await this.redisService.getJsonDataWithPath(
          input + 'nodeProperty',
          '.' + arr[s].nodeid,
        );
        const nodekey = JSON.parse(apikey).nodeName;
        const configdata = JSON.parse(apikey).data;
        obj[nodekey] = configdata;
      }
    }
    return JSON.stringify(obj);
  }
  async goRule(content: any, data: any) {
    const engine = new ZenEngine();
    const decision = engine.createDecision(content);
    const result = await decision.evaluate(data);
    engine.dispose();
    return result;
  }

  async getNodeList(
    applicationName,
    version,
    artifact,
    tenant,
    appGroup,
    fabrics,
  ): Promise<any> {
    try {
      let res;
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

      const result = await Promise.all([nodes])
        .then((values) => {
          console.log('🚀 ~ AppService ~ values:', values);
          return values;
        })
        .catch((error) => {
          throw new BadRequestException(error);
        });

      let resultNodes = JSON.parse(result[0]) || [];
      if (fabrics == 'PF' || fabrics == 'DF') {
        res =
          resultNodes.length > 0 &&
          resultNodes.map((item: any) => {
            console.log(item, 'item');
            return {
              nodeId: item.id,
              nodeName: item.data.label,
              nodeType: item.type,
              data: item,
            };
          });
      }
      if (fabrics == 'UF') {
        res =
          resultNodes &&
          resultNodes
            .filter((node) => node.type == 'group')
            .map((item: any) => {
              return {
                nodeId: item.id,
                nodeName: item.data.label,
                nodeType: item.type,
                control: resultNodes
                  .filter((node) => node?.parentNode == item.id)
                  .map((item: any) => {
                    return {
                      nodeId: item.id,
                      nodeName: item.data.label,
                      nodeType: item.type,
                      data: item,
                    };
                  }),
              };
            });

        res = [
          ...res,
          {
            nodeId: 'canvas',
            nodeName: 'canvas',
            nodeType: 'group',
            control: resultNodes
              .filter(
                (node) =>
                  (!node.parentNode || !node.hasOwnProperty('parentNode')) &&
                  node.type !== 'group',
              )
              .map((item: any) => {
                return {
                  nodeId: item.id,
                  nodeName: item.data.label,
                  nodeType: item.type,
                  data: item,
                };
              }),
          },
        ];
      }

      return {
        data: res,
        status: 200,
      };
    } catch (error) {
      throw error;
    }
  }
}
