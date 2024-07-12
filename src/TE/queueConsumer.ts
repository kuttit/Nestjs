import { InjectQueue } from "@nestjs/bull";
import Bull, { Queue } from "bull";
import { Injectable } from "@nestjs/common";
import { Input } from "./Dto/input";
import { TeService } from "./te.service";


@Injectable()
export class QueueConsumer{ 
    constructor(@InjectQueue('pfPaymentProcess') private readonly pfprocessqueue: Queue){}  
    

    /**
+     * Autogenerates a queue with the given name and input data at a specified interval.
+     *
+     * @param {string} name - The name of the queue.
+     * @param {Input} input - The input data for the queue.
+     * @return {Promise<any>} - A promise that resolves to an object with the status and message.
+     */
    // async autogenerate(name: string,input: Input): Promise<any>{
    //   var queueResult
    //   setInterval(() => {
    //     queueResult = this.generateQueue(name,input)
    //   },3000)          
    //   return queueResult
    // }

    /**
     * Generates a new queue with the given name and input data.
     *
     * @param {string} name - The name of the queue.
     * @param {Input} input - The input data for the queue.
     * @return {Promise<any>} - A promise that resolves to an object with the status and message.
     */
    async generateQueue(name: string,input: Input): Promise<any> {      
        await this.pfprocessqueue.add({ processName: 'PF',input }); 
        
        return {
          status: 200,
          message: `Queue with name ${name} generated successfully!`,
        };  
      }
    

       /**
     * Retrieves all jobs from the specified queue.
     *
     * @param {string} name - The name of the queue.
     * @return {Promise<Bull.Job[]>} - A promise that resolves to an array of Bull.Job objects representing the jobs in the queue.
     */
      async getAllJobsFromQueue(name: string): Promise<Bull.Job[]> {
        const jobStatuses: Bull.JobStatus[] = [
          'waiting',
          // 'delayed',
           //'active',
          // 'completed',
          // 'failed',
        ];        
        const jobs: Bull.Job[] = await this.pfprocessqueue.getJobs(jobStatuses);
        return jobs;
      }
   

}