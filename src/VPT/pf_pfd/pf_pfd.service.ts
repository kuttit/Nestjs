import { BadRequestException, Injectable } from '@nestjs/common';

import { RedisService } from 'src/redisService';

@Injectable()
export class PfPfdService {
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
        nodes: JSON.parse(result[0]) || [],
        nodeEdges: JSON.parse(result[1]) || [],
        nodeProperty: JSON.parse(result[2]) || {},
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
      let result = {};

      let sd = null;
      let processflowapi = [];
      let processFlowSummary = [];

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

      const nodes = JSON.parse(JSON.stringify(req.flow.nodes));
      const edges = JSON.parse(JSON.stringify(req.flow.nodeEdges));
      if (nodes.length > 0 && edges.length > 0) {
        let condiforStart = false;
        let condiforEnd = false;
        nodes.map((node) => {
          if (node.type === 'startnode') {
            condiforStart = true;
          }

          if (node.type === 'endnode') {
            condiforEnd = true;
          }
        });

        if (condiforStart && condiforEnd) {
          processFlowSummary = this.findAllRoutesWithFormatAndDecision(
            nodes,
            edges,
          );
          sd = this.newCreatePrcessFlow(edges, nodes);
          processflowapi = this.sortProcessFlow(sd);
        }
      }
      result = {
        nodes: req.flow.nodes,
        nodeEdges: req.flow.nodeEdges,
        processFlow: [...processflowapi],
        processFlowSummary: [...processFlowSummary],
        nodeProperty: flowNodesProperty,
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
    const res = await this.redisService.getJsonData('PF:defaultJson');
    if (res) {
      const parsedData = JSON.parse(res);
      const keys = Object.keys(parsedData);
      const lastKey = keys[keys.length - 1];
      return parsedData[lastKey]?.nodeConfig;
    } else {
      return null;
    }
  }
  updateArrayWithLabel(array, edge) {
    return array.map((node, index) => {
      let i = index;
      if (index > 0) {
        index = index - 1;
      }
      const labelInfo = edge.find(
        (edg) => edg.source === node.sourceNode && edg.target === node.nodeId,
      );
      if (labelInfo && array[index].nodeId == labelInfo.source) {
        array[index].label = labelInfo.label;
      }
      return node;
    });
  }
  findAllRoutesWithFormatAndDecision(node, edges) {
    let nodes = structuredClone(node);
    let edge = structuredClone(edges);
    let adjacencyList = {};
    const updateLable = (routeArray) => {
      let childRoute = [...routeArray];
      routeArray.forEach((parent) => {
        if (parent?.source) {
          childRoute.map((child) => {
            if (parent.source == child.NodeId) {
              if (parent?.conditionResult) {
                child.conditionResult = parent.conditionResult;
                delete parent.conditionResult;
              }
            }
          });
        }
      });
      childRoute.forEach((e) => {
        delete e.source;
      });
      return childRoute;
    };
    function findAllRoutes(
      startNode,
      endNode,
      visited = new Set(),
      currentRoute = [],
      allRoutes = [],
    ) {
      visited.add(startNode);
      let getNode = nodes.find((node) => node.id == startNode);
      let nodeObj = {
        NodeId: startNode,
        NodeName: getNode.data.label,
        NodeType: getNode.type,
      };
      currentRoute.push(nodeObj);
      if (startNode === endNode) {
        let flowName = `flow${allRoutes.length + 1}`;
        allRoutes.push({ [flowName]: [...currentRoute] });
      } else if (adjacencyList[startNode]) {
        for (const neighbor of adjacencyList[startNode]) {
          if (!visited.has(neighbor)) {
            findAllRoutes(neighbor, endNode, visited, currentRoute, allRoutes);
          }
        }
      }
      visited.delete(startNode);
      currentRoute.pop();
    }

    const findAllRoutesWithFormatAndDecisionResults = (nodes, edges) => {
      const graph = {};
      edges.forEach((edge) => {
        if (!graph[edge.source]) {
          graph[edge.source] = [];
        }
        graph[edge.source].push({
          target: edge.target,
          sourcenodeid: edge.source,
          label: edge.label,
        });
      });
      const allRoutes = [];
      const dfs = (node, currentRoute) => {
        const neighbors = graph[node] || [];
        neighbors.forEach((neighborInfo) => {
          const newRoute = [
            ...currentRoute,
            {
              nodeId: neighborInfo.target,
              sourcenodeid: neighborInfo.sourcenodeid,
              label: neighborInfo.label,
            },
          ];
          dfs(neighborInfo.target, newRoute);
        });
        if (neighbors.length === 0) {
          allRoutes.push(currentRoute);
        }
      };
      nodes.forEach((node) => {
        if (node.type === 'startnode') {
          const startNodeId = node.id;
          dfs(startNodeId, [{ nodeId: startNodeId, label: null }]);
        }
      });
      const formattedRoutes = allRoutes.map((route, index) => {
        let newArray = [];
        let currentConditionResult = null;
        let routeArray = route.map((routeItem) => {
          const sourceNodeId = routeItem.nodeId;
          const sourceNode = nodes.find((node) => node.id === sourceNodeId);
          if (sourceNode) {
            currentConditionResult = routeItem.label;
          }
          let routes = {
            nodeType:
              sourceNode.property.nodeType == 'defaultNode'
                ? sourceNode.type
                : sourceNode.property.nodeType,
            NodeId: sourceNode.id,
            Nodename: sourceNode.data.label,
            source: routeItem.sourcenodeid,
          };
          if (currentConditionResult) {
            routes['conditionResult'] = currentConditionResult;
          }
          return routes;
        });
        let routeOptionArray = updateLable(routeArray);
        let flowName = `flow${index + 1}`;
        return { [flowName]: routeOptionArray };
      });
      return formattedRoutes;
    };

    const summeryFlow = () => {
      const adjacencyList = {};
      edge.forEach((edge) => {
        if (!adjacencyList[edge.source]) {
          adjacencyList[edge.source] = [];
        }
        adjacencyList[edge.source].push(edge.target);
      });
      const routesWithFormatAndDecisionResults =
        findAllRoutesWithFormatAndDecisionResults(nodes, edge);
      return routesWithFormatAndDecisionResults;
    };
    let summeryRoutes = summeryFlow();
    return summeryRoutes;
  }
  newCreatePrcessFlow(edges, node) {
    let nodes = structuredClone(node);
    let edge = structuredClone(edges);

    const initElement = (item, element) => {
      item.role = element.data.role;

      item.nodeType =
        element.property.nodeType == 'defaultNode'
          ? element.type
          : element.property.nodeType;

      item.nodeId = element.id;
      if (typeof element?.parentId === 'object') {
        item.parentId = [...element?.parentId];
      } else {
        item.parentId = element?.parentId;
      }

      item.nodeName = element.property.name;

      item.nodeDesc = element.property.description;

      return item;
    };

    const addingElements = (item, array) => {
      if (array.filter((x) => x.id === item.id).length === 0) {
        let element = nodes.find((node) => node.id == item.source);

        array.push(initElement(item, element));
      }
    };

    const processFlow = () => {
      const resultObj = {};

      let array = [];

      let removeFields = [
        'source',

        'label',

        'sourceHandle',

        'selected',

        'targetHandle',

        'target',

        'type',

        'markerEnd',

        'id',
      ];

      edge.map((edges) => {
        addingElements(edges, array);
      });

      array.forEach((obj) => {
        let routeArray = [];

        const { source, target } = obj;

        let initRouteObj = {};

        if (!resultObj[source]) {
          resultObj[source] = obj;
        }

        if (obj.label) {
          initRouteObj['conditionResult'] = obj.label;
        }

        initRouteObj['nodeName'] = nodes.find(
          (node) => node.id == target,
        ).data.label;

        initRouteObj['nodeId'] = target;

        routeArray.push(initRouteObj);

        if (resultObj[source]?.routeArray?.length > 0) {
          let check = resultObj[source].routeArray.findIndex(
            (index) => obj.nodeId == source,
          );

          if (check >= 0) {
            resultObj[source].routeArray.push(initRouteObj);
          }
        } else {
          resultObj[source].routeArray = routeArray;
        }

        Object.keys(resultObj[source]).map((key) => {
          let status = removeFields.includes(key);

          if (status) {
            delete resultObj[source][key];
          }
        });
      });

      const updatedArray = Object.values(resultObj);

      let endNodeElement = nodes.find((node) => node.type == 'endnode');

      let item = initElement({}, endNodeElement);

      updatedArray.push(item);

      return updatedArray;
    };

    let processFlowResult = processFlow();

    return processFlowResult;
  }

  async readReddis(tenant): Promise<any> {
    return await this.redisService.getJsonData(tenant);
  }

  async writeReddis(key, json): Promise<any> {
    await this.redisService.setJsonData(key, JSON.stringify(json));
  }

  sortProcessFlow(processFlow) {
    let startNode = processFlow.find((node) => node.nodeType == 'startnode');
    let uniId = [];
    processFlow.map((ele) => {
      if (!uniId.includes(ele.nodeId)) {
        uniId.push(ele.nodeId);
      }
    });
    let alterData = [];
    processFlow.map((ele) => {
      if (ele.parentId.length == 0) {
        alterData.push(ele);
      }
      if (ele.parentId.length > 0) {
        if (
          ele.parentId.every((v) => {
            uniId.includes(v);
          })
        ) {
          alterData.push(ele);
        } else {
          alterData.push({
            ...ele,
            parentId: ele.parentId.filter((v) => uniId.includes(v)),
          });
        }
      }
    });
    let proFlow = [];
    proFlow.push(startNode);

    let includedId = [startNode.nodeId];

    console.log(proFlow, '-------->');
    for (let j = 0; includedId.length + 1 != alterData.length; ) {
      if (proFlow[j]?.routeArray.length > 0) {
        let route = proFlow[j]?.routeArray;

        for (let rou of route) {
          let data = alterData.find((node) => node.nodeId == rou.nodeId);
          if (
            data.nodeType !== 'endnode' &&
            !includedId.includes(data.nodeId) &&
            data.parentId.every((v) => includedId.includes(v))
          ) {
            includedId.push(data.nodeId);
            proFlow.push(data);
            // }
          }
        }
      }

      if (
        processFlow.length == j + 2 &&
        includedId.length + 1 !== processFlow.length
      ) {
        j = 0;
      } else {
        j = j + 1;
      }
    }

    proFlow.push(processFlow.find((node) => node.nodeType == 'endnode'));

    return proFlow;
  }
}
