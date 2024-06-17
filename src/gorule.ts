import { ZenEngine } from "@gorules/zen-engine";

export class GoRuleEngine {

/*
   creating a decision using the provided content, 
   evaluating the decision with the provided data
   @params content - json file of decision table
   @params data    - data which is to be evaluated
*/
async goRule(content:any, data:any){
      
   const engine = new ZenEngine();
         const decision = engine.createDecision(content);     
         
         const result = await decision.evaluate(data);               
        
         engine.dispose();
         return result
}
}
