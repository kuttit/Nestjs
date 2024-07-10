import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

import { GoRuleEngine } from './gorule';
import { RedisService } from 'src/redisService';

@Injectable()
export class ExecutionService {
  constructor(
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
  ) {}

  async getProcess(key, nodeName, code) {
    try {
      var result = await this.pfProcessor(key, nodeName, code);
      return { status: 201, data: result };
    } catch (error) {
      return { status: 400, err: error };
    }
  }

  async pfProcessor(key, nodeName, code) {
    var arr = [];
    var nodeid;
    const json = await this.redisService.getJsonData(key + 'processFlow');

    var pfjson: any = JSON.parse(json);

    // var input = await this.redisService.getJsonDataWithPath('PEdata','.url');

    for (var i = 0; i < pfjson.length; i++) {
      // Start Node

      if (pfjson[i].nodeName == 'Start') {
        var obj = {};
        obj['nodeid'] = pfjson[i].nodeId;
        obj['nodename'] = pfjson[i].nodeName;
        obj['nodetype'] = pfjson[i].nodeType;
        arr.push(obj);
        var deci = {};
        deci['nodeName'] = pfjson[i].nodeName;

        nodeid = pfjson[i].routeArray[0].nodeId;
      }
      // Humantask node

      if (
        nodeid == pfjson[i].nodeId &&
        pfjson[i].nodeType == 'humantasknode' &&
        (pfjson[i].nodeName != 'Start' || pfjson[i].nodeName != 'End')
      ) {
        var obj = {};
        obj['nodeid'] = pfjson[i].nodeId;
        obj['nodename'] = pfjson[i].nodeName;
        obj['nodetype'] = pfjson[i].nodeType;
        arr.push(obj);
        if (pfjson[i].nodeName == nodeName) {
          var res = await this.customCodeProcess(key, nodeName, code, arr);
          return res;
        }
        nodeid = pfjson[i].routeArray[0].nodeId;
      }

      // Decision Node

      if (
        nodeid == pfjson[i].nodeId &&
        pfjson[i].nodeType == 'decisionnode' &&
        (pfjson[i].nodeName != 'Start' || pfjson[i].nodeName != 'End')
      ) {
        var obj = {};
        obj['nodeid'] = pfjson[i].nodeId;
        obj['nodename'] = pfjson[i].nodeName;
        obj['nodetype'] = pfjson[i].nodeType;
        arr.push(obj);
        var currNode = await this.redisService.getJsonDataWithPath(
          key + 'nodeProperty',
          '.' + pfjson[i].nodeId,
        );
        var ruleChk = JSON.parse(currNode).rule;
        if (ruleChk) {
          var zenresult = await this.zenrule(key, ruleChk, pfjson[i].nodeId);
        }
        if (pfjson[i].nodeName == nodeName) {
          var res = await this.customCodeProcess(key, nodeName, code, arr);
          return res;
        }
        for (var k = 0; k < pfjson[i].routeArray.length; k++) {
          if (pfjson[i].routeArray[k].conditionResult == zenresult) {
            nodeid = pfjson[i].routeArray[k].nodeId;
            break;
          }
        }
      }

      // Api Node
      if (
        nodeid == pfjson[i].nodeId &&
        pfjson[i].nodeType == 'apinode' &&
        pfjson[i].nodeName != 'Start' &&
        pfjson[i].nodeName != 'End'
      ) {
        var obj = {};
        obj['nodeid'] = pfjson[i].nodeId;
        obj['nodename'] = pfjson[i].nodeName;
        obj['nodetype'] = pfjson[i].nodeType;
        arr.push(obj);
        if (pfjson[i].nodeName == nodeName) {
          var res = await this.customCodeProcess(key, nodeName, code, arr);
          return res;
        }

        nodeid = pfjson[i].routeArray[0].nodeId;
      }

      // End Node

      if (pfjson[i].nodeName == 'End') {
        var obj = {};
        obj['nodeid'] = pfjson[i].nodeId;
        obj['nodename'] = pfjson[i].nodeName;
        obj['nodetype'] = pfjson[i].nodeType;
        arr.push(obj);
        break;
      }
    }
  }

  async zenrule(key: any, wfarr: any, nodeId: any) {
    var goruleEngine: GoRuleEngine = new GoRuleEngine();

    var greq = JSON.parse(
      await this.redisService.getJsonDataWithPath(
        key + 'nodeProperty',
        '.' + nodeId + '.rule..inputs',
      ),
    );
    var gparamreq = {};
    for (var g = 0; g < greq.length; g++) {
      var decreq = JSON.parse(
        await this.redisService.getJsonDataWithPath(
          key + 'nodeProperty',
          '.' + nodeId + '.data.pro.request' + '..' + greq[g].field,
        ),
      );
      gparamreq[greq[g].field] = decreq;
    }

    var goruleres = await goruleEngine.goRule(wfarr, gparamreq);
    return goruleres.result.output;
  }

  async customCodeProcess(key: any, nodeName: any, code: any, arr: any) {
    var data = code;
    console.log(arr);
    if (data != undefined) {
      for (var k = 1; k < arr.length; k++) {
        if (arr[k].nodeName != 'Start' && arr[k].nodeName != 'End') {
          var curnName = arr[k].nodename.toLowerCase();
          console.log(curnName);
          var str = data.indexOf(curnName);
          console.log(str);
          if (str != -1) {
            var value = await this.redisService.getJsonDataWithPath(
              key + 'nodeProperty',
              '.' + arr[k].nodeid + '.data.pro.request',
            );

            var chkdata = JSON.parse(value);
            // get the key and value of decision node request data
            var chkkey = Object.keys(chkdata);
            var chkval = Object.values(chkdata);
            // form the data for replace the value in the customcode
            for (var s = 0; s < chkkey.length; s++) {
              var val = curnName + '.pro.request.' + chkkey[s];
              if (data.indexOf(val)) {
                data = data.replace(new RegExp(val, 'g'), chkval[s]);
              } else {
                throw 'Bad Request';
              }
            }
          }
        }
      }

      console.log(data);

      //let result = ts.transpile(data);
      // evaluate the custom code
      var t1 = await this.customCodeExcute(data);
      return t1;
    } else {
      return true;
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

      let result = data;

      return result;
    } catch (error) {
      throw error;
    }
  }
}
