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
   /**
   * Retrieves JSON data from Redis.
   * @param key The key used to identify the JSON data in Redis.
   * @returns The JSON data retrieved from Redis.
   * @throws {Error} If there is an error retrieving the JSON data.
   */
  async getJsonData(key: string) {
    try {
      var request: any = await redis.call('JSON.GET', key);
      return request;
    } catch (error) {
      throw error
    } 
  }

  
 /**
   * Checks if a key exists in Redis.
   * @param key The key to check in Redis.
   * @returns The result of the EXISTS command (0 or 1).
   * @throws {Error} If there is an error executing the EXISTS command.
   */
  async exist(key){
    try {
      var request = await redis.call('EXISTS', key)     
      return request
    } catch (error) {
      throw error
    }
  }

  //Retrieves JSON data from Redis with specified path
  /**
   * Retrieves JSON data from Redis with a specified path.
   * @param key The key used to identify the JSON data in Redis.
   * @param path The path to the specific JSON value within the JSON data.
   * @returns The JSON value at the specified path.
   * @throws {Error} If there is an error retrieving the JSON value.
+   */
  async getJsonDataWithPath(key: string, path: string) {  
    try {
      var request = await redis.call('JSON.GET', key, path);
      return request;
    } catch (error) {
      throw error
    }
   
  }

  //To store JSON data in redis
  /**
   * Stores JSON data in Redis.
   * @param key The key used to identify the JSON data in Redis.
   * @param value The JSON data to be stored.
   * @param path The path to the specific JSON value within the JSON data.
   * @returns A string indicating that the value was stored.
   * @throws {Error} If there is an error storing the JSON data.
   */
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
 /**
   * Stores stream data in Redis.
   * @param streamName The name of the Redis stream.
   * @param key The key used to identify the stream data.
   * @param strValue The stream data to be stored.
   * @returns The ID of the added message.
   * @throws {Error} If there is an error storing the stream data.
   */

  async setStreamData(streamName: string, key: string, strValue: any) {
    try {
      var result = await redis.xadd(streamName, '*', key, strValue);
      return result;
    } catch (error) {
      throw error;
    }
  }

  //Retrieves stream data from Redis
   /**
   * Retrieves stream data from Redis.
   * @param streamName The name of the Redis stream.
   * @returns An array of messages in the stream.
   * @throws {Error} If there is an error retrieving the stream data.
   */
  async getStreamData(streamName) {
    try {
      var messages = await redis.xread('STREAMS', streamName, 0);
      return messages;
    } catch (error) {
      throw error;
    }
  }

   /**
   * Retrieves stream data from Redis using XRANGE command.
   * 
   * @param {string} streamName - The name of the Redis stream.
   * @returns {Promise<string[][]>} - An array of messages in the stream.
   * @throws {Error} - If there is an error retrieving the stream data.
   */
  async getStreamRange(streamName){
    try {
      var messages = await redis.call('XRANGE', streamName, '-', '+');
      return messages;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves stream data from Redis using XREVRANGE command.
   * 
   * @param {string} streamName - The name of the Redis stream.
   * @param {number} count - The number of messages to retrieve.
   * @returns {Promise<string[][]>} - An array of messages in the stream.
   * @throws {Error} - If there is an error retrieving the stream data.
   */
  async getStreamRevRange(streamName, count) {
    try {      
      var messages =  await redis.xrevrange(streamName, '+', '-', 'COUNT', count);
      return messages;
    } catch (error) {
      throw error;
    }
  }
  
  //Retrieves stream data from Redis with count
  /**
   * Retrieves stream data from Redis with count.
   * 
   * @param {number} count - The number of messages to retrieve.
   * @param {string} streamName - The name of the Redis stream.
   * @returns {Promise<string[][]>} - An array of messages in the stream.
   * @throws {Error} - If there is an error retrieving the stream data.
   */
  async getStreamDatawithCount(count, streamName) {
    try {
      var messages = await redis.xread('COUNT',count,'STREAMS',streamName,0);
      return messages;
    } catch (error) {
      throw error;
    }
  }

  //To create a consumer group for a given stream in Redis
  /**
   * Creates a consumer group for a given stream in Redis.
   *
   * @param {string} streamName - The name of the Redis stream.
   * @param {string} groupName - The name of the consumer group.
   * @returns {Promise<string>} - A promise that resolves to a string indicating the consumer group was created.
   * @throws {Error} - If there is an error creating the consumer group.
  */
  async createConsumerGroup(streamName, groupName) {
    try {
      await redis.xgroup('CREATE',streamName,groupName,'0','MKSTREAM');
      return `consumerGroup was created as ${groupName}`;
    } catch (error) {
      throw error
    }   
  }

  //To create a consumer within a consumer group in Redis
  /**
   * Creates a consumer within a consumer group in Redis.
   * @param {string} streamName - The name of the Redis stream.
   * @param {string} groupName - The name of the consumer group.
   * @param {string} consumerName - The name of the consumer.
   * @returns {Promise<string>} - A promise that resolves to a string indicating the consumer was created.
   * @throws {Error} - If there is an error creating the consumer.
   */
  async createConsumer(streamName, groupName, consumerName) {
    try {
      var result = await redis.xgroup('CREATECONSUMER',streamName,groupName,consumerName);
      return result;
    } catch (error) {
      throw error;
    }
  }

  //To reads messages from a Redis stream for a specific consumer group.
  /**
   * Reads messages from a Redis stream for a specific consumer group.
   * @param {string} streamName - The name of the Redis stream.
   * @param {string} groupName - The name of the consumer group.
   * @param {string} consumerName - The name of the consumer.
   * @returns {Promise<Array>} - A promise that resolves to an array of objects containing the message ID and data.
   * @throws {Error} - If there is an error reading the messages.
   */
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

  /**
   * Acknowledges a message in a Redis stream using the XACK command.
   * @param {string} streamName - The name of the Redis stream.
   * @param {string} groupName - The name of the consumer group.
   * @param {string} msgId - The message ID to acknowledge.
   * @returns {Promise<string>} - A promise that resolves to the result of the XACK command.
   * @throws {Error} - If there is an error acknowledging the message.
   */
  async ackMessage(streamName, groupName, msgId) {
    try {
      let result = await redis.xack(streamName, groupName, msgId);
      return result;
    } catch (error) {
      throw error
    } 
  }


   /**
   * Retrieves information about a consumer group in Redis.
   * @param {string} groupName - The name of the consumer group.
   * @returns {Promise<Array>} - A promise that resolves to an array of information about the consumer group.
   * @throws {Error} - If there is an error retrieving the information.
   */
  async getInfoGrp(groupName){
    try {     
      let result = await redis.xinfo('GROUPS', groupName);   
      return result
    } catch (error) {
      throw error
    } 
  }

  //To acknowledge a message in a Redis stream
  /**
   * Retrieves all keys in Redis that match a given pattern.
   * @param {string} key - The pattern to match against Redis keys.
   * @returns {Promise<Array>} - A promise that resolves to an array of keys that match the pattern.
   * @throws {Error} - If there is an error retrieving the keys.
   */
  async getKeys(key: string) {
    try {
      var keys = await redis.keys(key + ':*');
      return keys;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a key in Redis.
   * @param {string} key - The key to delete.
   * @returns {Promise<void>} - A promise that resolves when the key is deleted.
   * @throws {Error} - If there is an error deleting the key.
   */
  async deleteKey(key: any) {
    try {
      await redis.del(key);
    } catch (error) {
      throw error;
    }
  }


  /**
   * Sets an expiration time for a Redis key.
   *
   * @param {string} key - The key to set the expiration time for.
   * @param {number} seconds - The number of seconds before the key expires.
   * @returns {Promise<number>} - A promise that resolves to the number of seconds
   * before the key expires, or 0 if the key does not exist.
   * @throws {Error} - If there is an error setting the expiration time.
   */
  async expire(key, seconds){
    try {
      var result = await redis.call('EXPIRE', key , seconds)
      return result
    } catch (error) {
      throw error
    }   
  }
}
