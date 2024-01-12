/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

type SelectOption = {
  choices?: Array<any>;
  hash?: number;
  hashRing?: Map<number, any>;
};

export default function select(type: string, options?: SelectOption) {
  switch (type.toLowerCase()) {
    case "Random".toLowerCase():
      if (!options?.choices) {
        throw Error("please give choices");
      }
      return randomSelect(options.choices);

    case "RoundRobin".toLowerCase():
      if (!options?.choices) {
        throw Error("please give choices");
      }
      return roundRobinSelect(options.choices);

    case "LeastActive".toLowerCase():
      if (!options?.choices) {
        throw Error("please give choices");
      }
      return leastActiveSelect(options.choices);

    case "ConsistentHash".toLowerCase():
      if (!options?.hashRing || !options.hash) {
        throw Error("need hash and hashRing");
      }
      return consistentHashSelect(options.hash, options.hashRing);

    default:
      throw Error("type must be specified");
  }
}

function randomSelect(choices: Array<any>) {
  const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < choices.length; i++) {
    random = random - choices[i].weight;
    if (random < 0) return choices[i];
  }

  // if all choices weight are 0，return random choice
  return choices[Math.floor(Math.random() * choices.length)];
}

function roundRobinSelect(choices: Array<any>) {
  const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let flag = 0;
  choices.forEach((choice) => {
    choice.currentWeight = choice.currentWeight + choice.weight;
    flag = Math.max(choice.currentWeight, flag);
  });

  let maxResults = choices.filter((choice) => {
    return choice.currentWeight === flag;
  });

  let choice = randomSelect(maxResults);
  choice.currentWeight = choice.currentWeight - totalWeight;
  return choice;
}

function leastActiveSelect(choices: Array<any>) {
  let flag = Number.MAX_VALUE;
  choices.forEach((choice) => {
    flag = Math.min(choice.active, flag);
  });

  let minResults = choices.filter((choice) => {
    return choice.active === flag;
  });

  return randomSelect(minResults);
}

function consistentHashSelect(hash: number, hashRing: Map<number, any>) {
  let keys = Array.from(hashRing.keys()).sort();

  for (let nodeHash of keys) {
    if ((nodeHash as number) >= hash) {
      return this.hashRing.get(nodeHash)!;
    }
  }

  return this.hashRing.get(keys[0])!;
}
