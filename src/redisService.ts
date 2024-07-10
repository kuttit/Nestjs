import { Injectable } from '@nestjs/common';
const Redis = require('ioredis');
import 'dotenv/config';

export const redis = new Redis({
  host: process.env.HOST,
  port: parseInt(process.env.PORT),
}).on('error', (err) => {
  console.log('Redis Client Error', err);
  throw err;
});

@Injectable()
export class RedisService {
  //Retrieves JSON data from Redis
  async getJsonData(key: string) {
    try {
      var request: any = await redis.call('JSON.GET', key);
      return request;
    } catch (error) {
      throw error
    } 
  }

  async exist(key){
    try {
      var request = await redis.call('EXISTS', key)     
      return request
    } catch (error) {
      throw error
    }
  }

  //Retrieves JSON data from Redis with specified path
  async getJsonDataWithPath(key: string, path: string) {  
    try {
      var request = await redis.call('JSON.GET', key, path);
      return request;
    } catch (error) {
      throw error
    }
   
  }

  //To store JSON data in redis
  async setJsonData(key: string, value: any, path?: string) {
    try {
      if (path) {
        var defpath = '.' + path;
      } else {
        var defpath = '$';
      }
      await redis.call('JSON.SET', key, defpath, value);
      return 'Value Stored';
    } catch (error) {
      throw error
    }
   
  }

  //To store Stream data in redis
  async setStreamData(streamName: string, key: string, strValue: any) {
    try {
      var result = await redis.xadd(streamName, '*', key, strValue);
      return result;
    } catch (error) {
      throw error;
    }
  }

  //Retrieves stream data from Redis
  async getStreamData(streamName) {
    try {
      var messages = await redis.xread('STREAMS', streamName, 0);
      return messages;
    } catch (error) {
      throw error;
    }
  }
  async getStreamRange(streamName){
    try {
      var messages = await redis.call('XRANGE', streamName, '-', '+');
      return messages;
    } catch (error) {
      throw error;
    }
  }

  async getStreamRevRange(streamName, count) {
    try {      
      var messages =  await redis.xrevrange(streamName, '+', '-', 'COUNT', count);
      return messages;
    } catch (error) {
      throw error;
    }
  }
  //Retrieves stream data from Redis with count
  async getStreamDatawithCount(count, streamName) {
    try {
      var messages = await redis.xread('COUNT',count,'STREAMS',streamName,0);
      return messages;
    } catch (error) {
      throw error;
    }
  }

  //To create a consumer group for a given stream in Redis
  async createConsumerGroup(streamName, groupName) {
    try {
      await redis.xgroup('CREATE',streamName,groupName,'0','MKSTREAM');
      return `consumerGroup was created as ${groupName}`;
    } catch (error) {
      throw error
    }   
  }

  //To create a consumer within a consumer group in Redis
  async createConsumer(streamName, groupName, consumerName) {
    try {
      var result = await redis.xgroup('CREATECONSUMER',streamName,groupName,consumerName);
      return result;
    } catch (error) {
      throw error;
    }
  }

  //To reads messages from a Redis stream for a specific consumer group.
  async readConsumerGroup(streamName, groupName, consumerName) {
    try {
      var msgId1: string;
      var res = [];
      var result = await redis.xreadgroup('GROUP',groupName,consumerName,'STREAMS',streamName,'>');
      //console.log(result)
      if (result) {
        result.forEach(([key, message]) => {
          message.forEach(([messageId, data]) => {
            msgId1 = messageId;
            var obj = {}
            obj['msgid']=messageId
            obj['data'] = data           
            res.push(obj);
          });
        });       
        return res;
      } else {
        return 'No Data available to read';
      }
    } catch (error) {
      throw error;
    }
  }

  async ackMessage(streamName, groupName, msgId) {
    try {
      let result = await redis.xack(streamName, groupName, msgId);
      return result;
    } catch (error) {
      throw error
    } 
  }

  async getInfoGrp(groupName){
    try {     
      let result = await redis.xinfo('GROUPS', groupName);   
      return result
    } catch (error) {
      throw error
    } 
  }

  //To acknowledge a message in a Redis stream
  async getKeys(key: string) {
    try {
      var keys = await redis.keys(key + ':*');
      return keys;
    } catch (error) {
      throw error;
    }
  }

  async deleteKey(key: any) {
    try {
      await redis.del(key);
    } catch (error) {
      throw error;
    }
  }

  async expire(key, seconds){
    try {
      var result = await redis.call('EXPIRE', key , seconds)
      return result
    } catch (error) {
      throw error
    }   
  }
}
