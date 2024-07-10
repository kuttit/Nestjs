import { InjectQueue, Process, Processor } from "@nestjs/bull";
import Bull, { Job, Queue } from "bull";
import { Injectable } from "@nestjs/common";
import { Input } from "./Dto/input";

//@Processor('pfProcess')
@Injectable()
export class QueueConsumer{ 
    constructor(@InjectQueue('pfPaymentProcess') private readonly pfprocessqueue: Queue){}  
    
    async generateQueue(name: string,input: Input): Promise<any> {
       // const queue: Bull.Queue = new Bull(name);
        await this.pfprocessqueue.add({ processName: 'PF',input }); 
        
        return {
          status: 200,
          message: `Queue with name ${name} generated successfully!`,
        };  
      }
    
      async getAllJobsFromQueue(name: string): Promise<Bull.Job[]> {
        const jobStatuses: Bull.JobStatus[] = [
          'waiting',
          // 'delayed',
          // 'active',
          // 'completed',
          // 'failed',
        ];
        // const queue: Bull.Queue = new Bull(name);
        const jobs: Bull.Job[] = await this.pfprocessqueue.getJobs(jobStatuses);
        return jobs;
      }

      async completeJobs(Job): Promise<void> {
        this.pfprocessqueue.process(async (Job, done) => {
          done();
        });
      }
}