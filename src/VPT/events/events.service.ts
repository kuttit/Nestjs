import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from 'src/redisService';

@Injectable()
export class EventsService {
  constructor(private readonly redisService: RedisService) {}

  async getEvents(
    tenant,
    appGroup,
    app,
    fabrics,
    artifact,
    version,
    componentName,
    controlName,
    eventsVersion,
  ) {
    try {
      let res = {};
      const nodes: Promise<any> = new Promise((resolve, reject) => {
        try {
          const node = this.redisService.getJsonData(
            tenant +
              ':' +
              appGroup +
              ':' +
              app +
              ':' +
              fabrics +
              ':' +
              artifact +
              ':' +
              version +
              ':' +
              'events:' +
              componentName +
              ':' +
              controlName +
              ':' +
              eventsVersion +
              ':' +
              'nodes',
          );
          resolve(node);
          console.log(node, 'Getting nodes');
        } catch (error) {
          reject(error);
        }
      });

      const nodeEdges: Promise<any> = new Promise((resolve, reject) => {
        try {
          const nodeEdge = this.redisService.getJsonData(
            tenant +
              ':' +
              appGroup +
              ':' +
              app +
              ':' +
              fabrics +
              ':' +
              artifact +
              ':' +
              version +
              ':' +
              'events:' +
              componentName +
              ':' +
              controlName +
              ':' +
              eventsVersion +
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
          const property = this.redisService.getJsonData(
            tenant +
              ':' +
              appGroup +
              ':' +
              app +
              ':' +
              fabrics +
              ':' +
              artifact +
              ':' +
              version +
              ':' +
              'events:' +
              componentName +
              ':' +
              controlName +
              ':' +
              eventsVersion +
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
      return {
        status: 200,
        data: res,
      };
    } catch (err) {
      console.log(err);
    }
  }

  async getVersion(
    tenant,
    appGroup,
    app,
    fabrics,
    artifact,
    version,
    componentName,
    controlName,
  ) {
    try {
      const keys = await this.redisService.getKeys(
        tenant +
          ':' +
          appGroup +
          ':' +
          app +
          ':' +
          fabrics +
          ':' +
          artifact +
          ':' +
          version +
          ':' +
          'events:' +
          componentName +
          ':' +
          controlName,
      );
      let versionList = new Set([]);
      if (keys && keys.length > 0) {
        for (let i = 0; i < keys.length; i++) {
          const version = keys[i].split(':');
          if (version.length == 11 && version[9]) versionList.add(version[9]);
        }

        return {
          status: 200,
          data: Array.from(versionList).sort(),
        };
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getWholeVersion(tenant, appGroup, app, fabrics, artifact, version) {
    try {
      const mainJson = JSON.parse(await this.redisService.getJsonData(tenant));
      console.log(
        mainJson[tenant]?.[appGroup]?.[app],
        'newjson',
        artifact,
        version,
      );
      const eventsWholeVersions =
        mainJson[tenant]?.[appGroup]?.[app]?.[fabrics]?.[artifact]?.[version]?.[
          'events'
        ];
      return {
        status: 200,
        data: eventsWholeVersions || [],
      };
    } catch (err) {
      console.log(err);
    }
  }

  async saveEvents(
    tenant,
    appGroup,
    app,
    fabrics,
    artifact,
    version,
    componentName,
    controlName,
    eventsVersion,
    resquestBody,
  ) {
    try {
      let data = resquestBody.data;

      const key = `${tenant}:${appGroup}:${app}:${fabrics}:${artifact}:${version}:events`;
      const type = resquestBody.type;

      let eventSummary = this.convertToNewFormat(data.nodes) || {};
      data = {
        ...data,
        eventSummary: eventSummary,
      };
      let newEventsVersion = 'v1';
      if (type === 'save') {
        let versionList = await this.getVersion(
          tenant,
          appGroup,
          app,
          fabrics,
          artifact,
          version,
          componentName,
          controlName,
        );
        if (
          versionList &&
          versionList.status === 200 &&
          versionList.data &&
          versionList.data.length > 0
        ) {
          newEventsVersion = `v${versionList.data.length + 1}`;
        }
      } else {
        newEventsVersion = eventsVersion;
      }

      Object.keys(data).forEach(async (keys) => {
        await this.redisService.setJsonData(
          key + `:${componentName}:${controlName}:${newEventsVersion}:${keys}`,
          JSON.stringify(data[keys]),
        );
      });
      if (type === 'save') {
        let versions = await this.getVersion(
          tenant,
          appGroup,
          app,
          fabrics,
          artifact,
          version,
          componentName,
          controlName,
        );
        if (versions && versions.status === 200 && versions.data) {
          return {
            status: 200,
            data: versions.data,
          };
        } else {
          return {
            status: 200,
            data: [],
          };
        }
      } else {
        return {
          status: 200,
          data: 'updated',
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async eventsWholeVersion(tenant, appGroup, app, fabrics, artifact, version) {
    try {
      let mainJson = JSON.parse(await this.redisService.getJsonData(tenant));

      let newCcwVersion = 'v1';
      if (mainJson) {
        if (!mainJson.hasOwnProperty(tenant)) {
          mainJson = { ...mainJson, [tenant]: {} };
        }
        if (!mainJson[tenant].hasOwnProperty(appGroup)) {
          mainJson[tenant] = { ...mainJson[tenant], [appGroup]: {} };
        }
        if (!mainJson[tenant][appGroup].hasOwnProperty(app)) {
          mainJson[tenant][appGroup] = {
            ...mainJson[tenant][appGroup],
            [app]: {},
          };
        }
        if (!mainJson[tenant][appGroup][app].hasOwnProperty(fabrics)) {
          mainJson[tenant][appGroup][app] = {
            ...mainJson[tenant][appGroup][app],
            [artifact]: {},
          };
        }

        if (
          !mainJson[tenant][appGroup][app][fabrics].hasOwnProperty(artifact)
        ) {
          mainJson[tenant][appGroup][app][fabrics] = {
            ...mainJson[tenant][appGroup][app][fabrics],
            [artifact]: {},
          };
        }

        if (
          !mainJson[tenant][appGroup][app][fabrics][artifact].hasOwnProperty(
            version,
          )
        ) {
          mainJson[tenant][appGroup][app][fabrics][artifact] = {
            ...mainJson[tenant][appGroup][app][fabrics][artifact],
            [version]: {},
          };
        }
        if (
          !mainJson[tenant][appGroup][app][fabrics][artifact][
            version
          ].hasOwnProperty('events')
        ) {
          mainJson[tenant][appGroup][app][fabrics][artifact][version] = {
            ...mainJson[tenant][appGroup][app][fabrics][artifact][version],
            ['events']: {},
          };
        }

        //Newly added Version for whole Versions

        if (
          Object.keys(
            mainJson[tenant][appGroup][app][fabrics][artifact][version][
              'events'
            ],
          ).length > 0
        ) {
          newCcwVersion = `v${
            Object.keys(
              mainJson[tenant][appGroup][app][fabrics][artifact][version][
                'events'
              ],
            ).length + 1
          }`;
          mainJson[tenant][appGroup][app][fabrics][artifact][version][
            'events'
          ] = {
            ...mainJson[tenant][appGroup][app][fabrics][artifact][version][
              'events'
            ],
            [newCcwVersion]: {},
          };
        } else {
          mainJson[tenant][appGroup][app][fabrics][artifact][version][
            'events'
          ] = {
            [newCcwVersion]: {},
          };
        }
      } else
        mainJson[tenant][appGroup][app][fabrics][artifact][version]['events'] =
          {
            [newCcwVersion]: {},
          };

      await this.redisService.setJsonData(tenant, JSON.stringify(mainJson));

      const savedVersion = Object.keys(
        mainJson[tenant][appGroup][app][fabrics][artifact][version]['events'],
      );
      return {
        status: 200,
        data: savedVersion,
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteEventVersion(
    tenant,
    appGroup,

    application,
    fabrics,
    artifact,
    version,
    componentName,
    controlName,
  ) {
    try {
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
          version +
          ':' +
          'events:' +
          componentName +
          ':' +
          controlName,
      );
      let versionList = await this.getVersion(
        tenant,
        appGroup,
        application,
        fabrics,
        artifact,
        version,
        componentName,
        controlName,
      );
      if (versionList && versionList.status === 200) {
        return {
          status: 200,
          data: versionList.data,
          message: 'Version Deleted Successfully',
        };
      } else
        return {
          status: 400,
          message: 'Version Not Found',
        };
    } catch (error) {
      throw error;
    }
  }

  async delete(key): Promise<any> {
    try {
      let allKeys = await this.redisService.getKeys(key);
      console.log('🚀 ~ AppService ~ allKeys:', allKeys);
      for (let i = 0; i < allKeys.length; i++) {
        console.log('Deleting Key : ' + allKeys[i]);
        await this.redisService.deleteKey(allKeys[i]);
      }
    } catch (error) {
      throw error;
    }
  }

  convertToNewFormat(nodes) {
    const cycleNodes = (children = '') => {
      let data = {};
      let uniqueId = [];
      nodes.map((node) => {
        if (
          !children &&
          node.data.sequence == 1 &&
          !uniqueId.includes(node.id)
        ) {
          uniqueId.push(node.id);
          let children = [];
          node.data.children.forEach((child) => {
            let data = cycleNodes(child);
            if (data) children.push({ ...data });
          });
          data = {
            ...data,
            id: node.id,
            type:
              node.type == 'controlNode' || node.type == 'groupNode'
                ? node.data.nodeType
                : node.type,
            name: node.data.label || node.data.nodeName,
            sequence: node.data.sequence,
            children: [...children],
          };
          if (node.data.hasOwnProperty('targetId')) {
            data['targetID'] = node.data.targetId;
          }
        }

        if (
          children == node.id &&
          node.data.children.length > 0 &&
          !uniqueId.includes(node.id)
        ) {
          uniqueId.push(node.id);
          let children = [];
          node.data.children.forEach((child) => {
            let data = cycleNodes(child);
            if (data) children.push({ ...data });
          });
          data = {
            ...data,
            id: node.id,
            type:
              node.type == 'controlNode' || node.type == 'groupNode'
                ? node.data.nodeType
                : node.type,
            name: node.data.label || node.data.nodeName,
            sequence: node.data.sequence,
            children: [...children],
          };
          if (node.data.hasOwnProperty('targetId')) {
            data['targetID'] = node.data.targetId;
          }
        }
        if (
          children == node.id &&
          node.data.children.length == 0 &&
          !uniqueId.includes(node.id)
        ) {
          uniqueId.push(node.id);
          data = {
            ...data,
            id: node.id,
            type:
              node.type == 'controlNode' || node.type == 'groupNode'
                ? node.data.nodeType
                : node.type,
            name: node.data.label || node.data.nodeName,
            sequence: node.data.sequence,
            children: [],
          };
          if (node.data.hasOwnProperty('targetId')) {
            data['targetID'] = node.data.targetId;
          }
        }
      });
      if (Object.keys(data).length > 0) return data;
      else return null;
    };

    return cycleNodes();
    // let convertedData = {};

    // // Filter only the control nodes

    // const controlNodes = nodes.filter(
    //   (node) =>
    //     node.type === 'controlNode' ||
    //     node.type === 'groupNode' ||
    //     node.type === 'handlerNode' ||
    //     node.type === 'responseNode',
    // );

    // // Iterate over each control node

    // controlNodes.forEach((node) => {
    //   if (node.type !== 'handlerNode' && node.type !== 'responseNode') {
    //     const newNode = {
    //       [node.id]: {
    //         nodeId: node.data.nodeId || node.id,

    //         nodeName: node.data.nodeName || node.data.label,

    //         nodeType: node.type,

    //         sequence: node.data.sequence,

    //         events: [],
    //       },
    //     };

    //     // If the control node has children (events)

    //     if (node.data.children) {
    //       // Iterate over each child

    //       node.data.children.forEach((eventId) => {
    //         const eventNode = nodes.find((item) => item.id === eventId);

    //         if (eventNode) {
    //           const event = {
    //             name: eventNode.data.label || eventNode.data.nodeName,

    //             handlers: [],
    //           };

    //           // If the event node has children (handlers)

    //           if (eventNode.data.children) {
    //             eventNode.data.children.forEach((handlerId) => {
    //               const handlerNode = nodes.find(
    //                 (item) =>
    //                   item.id === handlerId && item.type === 'handlerNode',
    //               );

    //               if (handlerNode) {
    //                 const targetNodeId = Array.isArray(
    //                   handlerNode.data.children,
    //                 )
    //                   ? handlerNode.data.children[0]
    //                   : handlerNode.data.children;

    //                 event.handlers.push({
    //                   handlerType: handlerNode.data.label,

    //                   handlerName: handlerNode.data.label,

    //                   sourceNodeId: eventNode.id,

    //                   sourceNodeName: eventNode.data.label,

    //                   targetNodeId: targetNodeId || handlerNode.id,

    //                   targetNodeName: targetNodeId
    //                     ? nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.nodeName
    //                     : handlerNode.data.label,

    //                   sequence: handlerNode.data.sequence,
    //                 });
    //               }
    //             });
    //           }

    //           newNode[node.id].events.push(event);
    //         }
    //       });
    //     }

    //     convertedData = { ...convertedData, ...newNode };
    //   }

    //   if (node.type == 'handlerNode') {
    //     const newNode = {
    //       [node.id]: {
    //         nodeId: node.data.nodeId || node.id,

    //         nodeName: node.data.nodeName || node.data.label,

    //         nodeType: node.type,

    //         sequence: node.data.sequence,
    //         control: [],
    //         component: [],
    //         handler: [],
    //         response: [],
    //       },
    //     };

    //     // If the control node has children (events)

    //     if (node.data.children) {
    //       // Iterate over each child

    //       node.data.children.forEach((eventId) => {
    //         const eventNode = nodes.find((item) => item.id === eventId);

    //         if (eventNode.type == 'groupNode') {
    //           const event = {
    //             id: eventNode.id,

    //             name: eventNode.data.label || eventNode.data.nodeName,

    //             events: [],
    //           };

    //           // If the event node has children (handlers)

    //           if (eventNode.data.children) {
    //             eventNode.data.children.forEach((handlerId) => {
    //               const handlerNode = nodes.find(
    //                 (item) => item.id === handlerId,
    //               );

    //               if (handlerNode) {
    //                 const targetNodeId = Array.isArray(
    //                   handlerNode.data.children,
    //                 )
    //                   ? handlerNode.data.children[0]
    //                   : handlerNode.data.children;

    //                 event.events.push({
    //                   Type: handlerNode.type,

    //                   Name: handlerNode.data.label || handlerNode.data.nodename,

    //                   sourceNodeId: eventNode.id,

    //                   sourceNodeName: eventNode.id
    //                     ? nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.nodeName
    //                     : eventNode.data.label,

    //                   targetNodeId: targetNodeId || handlerNode.id,

    //                   targetNodeName: targetNodeId
    //                     ? nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.nodeName
    //                     : handlerNode.data.label,

    //                   sequence: handlerNode.data.sequence,
    //                 });
    //               }
    //             });
    //           }

    //           newNode[node.id].component.push(event);
    //         }

    //         if (eventNode.type == 'controlNode') {
    //           const event = {
    //             id: eventNode.id,

    //             name: eventNode.data.label || eventNode.data.nodeName,

    //             events: [],
    //           };

    //           // If the event node has children (handlers)

    //           if (eventNode.data.children) {
    //             eventNode.data.children.forEach((handlerId) => {
    //               const handlerNode = nodes.find(
    //                 (item) => item.id === handlerId,
    //               );

    //               if (handlerNode) {
    //                 const targetNodeId = Array.isArray(
    //                   handlerNode.data.children,
    //                 )
    //                   ? handlerNode.data.children[0]
    //                   : handlerNode.data.children;

    //                 event.events.push({
    //                   Type: handlerNode.type,

    //                   Name: handlerNode.data.label,

    //                   sourceNodeId: eventNode.id,

    //                   sourceNodeName: eventNode.id
    //                     ? nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.nodeName
    //                     : eventNode.data.label,

    //                   targetNodeId: targetNodeId || handlerNode.id,

    //                   targetNodeName: targetNodeId
    //                     ? nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.nodeName
    //                     : handlerNode.data.label,

    //                   sequence: handlerNode.data.sequence,
    //                 });
    //               }
    //             });
    //           }

    //           newNode[node.id].control.push(event);
    //         }

    //         if (eventNode.type == 'handlerNode') {
    //           const event = {
    //             id: eventNode.id,

    //             name: eventNode.data.label || eventNode.data.nodeName,

    //             handlers: [],
    //           };

    //           // If the event node has children (handlers)

    //           if (eventNode.data.children) {
    //             eventNode.data.children.forEach((handlerId) => {
    //               const handlerNode = nodes.find(
    //                 (item) => item.id === handlerId,
    //               );

    //               if (handlerNode) {
    //                 const targetNodeId = Array.isArray(
    //                   handlerNode.data.children,
    //                 )
    //                   ? handlerNode.data.children[0]
    //                   : handlerNode.data.children;

    //                 event.handlers.push({
    //                   Type: handlerNode.type,

    //                   Name: handlerNode.data.label || handlerNode.data.nodeName,

    //                   sourceNodeId: eventNode.id,

    //                   sourceNodeName: eventNode.id
    //                     ? nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.nodeName
    //                     : eventNode.data.label,

    //                   targetNodeId: targetNodeId ?? handlerNode.id,

    //                   targetNodeName: targetNodeId
    //                     ? nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.label ??
    //                       nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.nodeName
    //                     : handlerNode.data.label ?? handlerNode.data.nodeName,

    //                   sequence: handlerNode.data.sequence,
    //                 });
    //               }
    //             });
    //           }

    //           newNode[node.id].handler.push(event);
    //         }
    //         if (eventNode.type == 'responseNode') {
    //           const event = {
    //             id: eventNode.id,

    //             name: eventNode.data.label || eventNode.data.nodeName,

    //             control: [],
    //             component: [],
    //             handler: [],
    //           };

    //           // If the event node has children (handlers)

    //           if (eventNode.data.children) {
    //             eventNode.data.children.forEach((handlerId) => {
    //               const handlerNode = nodes.find(
    //                 (item) => item.id === handlerId,
    //               );

    //               if (handlerNode) {
    //                 const targetNodeId = Array.isArray(
    //                   handlerNode.data.children,
    //                 )
    //                   ? handlerNode.data.children[0]
    //                   : handlerNode.data.children;

    //                 const data = {
    //                   Type: handlerNode.type,
    //                   responseType: eventNode.data.responseType,
    //                   Name: handlerNode.data.label || handlerNode.data.nodeName,

    //                   sourceNodeId: eventNode.id,

    //                   sourceNodeName: eventNode.id
    //                     ? nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.nodeName
    //                     : eventNode.data.label || eventNode.data.nodeName,

    //                   targetNodeId: targetNodeId || handlerNode.id,

    //                   targetNodeName: targetNodeId
    //                     ? nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.nodeName
    //                     : handlerNode.data.label || handlerNode.data.nodeName,

    //                   sequence: handlerNode.data.sequence,
    //                 };

    //                 if (handlerNode.type == 'controlNode') {
    //                   event.control.push(data);
    //                 }

    //                 if (handlerNode.type == 'groupNode') {
    //                   event.component.push(data);
    //                 }

    //                 if (handlerNode.type == 'handlerNode') {
    //                   event.handler.push(data);
    //                 }
    //               }
    //             });
    //           }

    //           newNode[node.id].response.push(event);
    //         }
    //       });
    //     }

    //     convertedData = { ...convertedData, ...newNode };
    //   }
    //   if (node.type == 'responseNode') {
    //     const newNode = {
    //       [node.id]: {
    //         nodeId: node.data.nodeId || node.id,

    //         nodeName: node.data.nodeName || node.data.label,

    //         nodeType: node.data.responseType,

    //         sequence: node.data.sequence,

    //         component: [],

    //         control: [],

    //         handler: [],
    //       },
    //     };

    //     // If the control node has children (events)

    //     if (node.data.children) {
    //       // Iterate over each child

    //       node.data.children.forEach((eventId) => {
    //         const eventNode = nodes.find((item) => item.id === eventId);

    //         if (eventNode.type == 'groupNode') {
    //           const event = {
    //             id: eventNode.id,

    //             name: eventNode.data.label || eventNode.data.nodeName,

    //             events: [],
    //           };

    //           // If the event node has children (handlers)

    //           if (eventNode.data.children) {
    //             eventNode.data.children.forEach((handlerId) => {
    //               const handlerNode = nodes.find(
    //                 (item) => item.id === handlerId,
    //               );

    //               if (handlerNode) {
    //                 const targetNodeId = Array.isArray(
    //                   handlerNode.data.children,
    //                 )
    //                   ? handlerNode.data.children[0]
    //                   : handlerNode.data.children;

    //                 event.events.push({
    //                   Type: handlerNode.type,

    //                   Name: handlerNode.data.label || handlerNode.data.nodename,

    //                   sourceNodeId: eventNode.id,

    //                   sourceNodeName: eventNode.id
    //                     ? nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.nodeName
    //                     : eventNode.data.label,

    //                   targetNodeId: targetNodeId || handlerNode.id,

    //                   targetNodeName: targetNodeId
    //                     ? nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.nodeName
    //                     : handlerNode.data.label,

    //                   sequence: handlerNode.data.sequence,
    //                 });
    //               }
    //             });
    //           }

    //           newNode[node.id].component.push(event);
    //         }

    //         if (eventNode.type == 'controlNode') {
    //           const event = {
    //             id: eventNode.id,

    //             name: eventNode.data.label || eventNode.data.nodeName,

    //             events: [],
    //           };

    //           // If the event node has children (handlers)

    //           if (eventNode.data.children) {
    //             eventNode.data.children.forEach((handlerId) => {
    //               const handlerNode = nodes.find(
    //                 (item) => item.id === handlerId,
    //               );

    //               if (handlerNode) {
    //                 const targetNodeId = Array.isArray(
    //                   handlerNode.data.children,
    //                 )
    //                   ? handlerNode.data.children[0]
    //                   : handlerNode.data.children;

    //                 event.events.push({
    //                   Type: handlerNode.type,

    //                   Name: handlerNode.data.label,

    //                   sourceNodeId: eventNode.id,

    //                   sourceNodeName: eventNode.id
    //                     ? nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.nodeName
    //                     : eventNode.data.label,

    //                   targetNodeId: targetNodeId || handlerNode.id,

    //                   targetNodeName: targetNodeId
    //                     ? nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.nodeName
    //                     : handlerNode.data.label,

    //                   sequence: handlerNode.data.sequence,
    //                 });
    //               }
    //             });
    //           }

    //           newNode[node.id].control.push(event);
    //         }

    //         if (eventNode.type == 'handlerNode') {
    //           const event = {
    //             id: eventNode.id,

    //             name: eventNode.data.label || eventNode.data.nodeName,

    //             handlers: [],
    //           };

    //           // If the event node has children (handlers)

    //           if (eventNode.data.children) {
    //             eventNode.data.children.forEach((handlerId) => {
    //               const handlerNode = nodes.find(
    //                 (item) => item.id === handlerId,
    //               );

    //               if (handlerNode) {
    //                 const targetNodeId = Array.isArray(
    //                   handlerNode.data.children,
    //                 )
    //                   ? handlerNode.data.children[0]
    //                   : handlerNode.data.children;

    //                 event.handlers.push({
    //                   Type: handlerNode.type,

    //                   Name: handlerNode.data.label || handlerNode.data.nodeName,

    //                   sourceNodeId: eventNode.id,

    //                   sourceNodeName: eventNode.id
    //                     ? nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.label ||
    //                       nodes.filter((node) => node.id == eventNode.id)[0]
    //                         ?.data.nodeName
    //                     : eventNode.data.label,

    //                   targetNodeId: targetNodeId ?? handlerNode.id,

    //                   targetNodeName: targetNodeId
    //                     ? nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.label ??
    //                       nodes.filter((node) => node.id == targetNodeId)[0]
    //                         ?.data.nodeName
    //                     : handlerNode.data.label ?? handlerNode.data.nodeName,

    //                   sequence: handlerNode.data.sequence,
    //                 });
    //               }
    //             });
    //           }

    //           newNode[node.id].handler.push(event);
    //         }
    //       });
    //     }

    //     convertedData = { ...convertedData, ...newNode };
    //   }
    // });

    // return convertedData;
  }
}
