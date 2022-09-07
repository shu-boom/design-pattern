const { ethers } = require("hardhat");
const hre = require("hardhat");

/*
    Resources:
    https://docs.ethers.io/v5/api/contract/contract/#Contract--events
    https://docs.ethers.io/v5/concepts/events/
*/
async function main() {
  const Events = await hre.ethers.getContractFactory("Events");
  const events = await Events.deploy();

  await events.deployed();

  console.log("Events deployed to:", events.address);

  signers = await ethers.getSigners();
  
  await events.connect(signers[0]).emitEvent(10);
  await events.connect(signers[1]).emitEvent(20);
  await events.connect(signers[2]).emitEvent(30);
  await events.connect(signers[3]).emitEvent(40);

  /**
   * The contract API offers on method on contract instances which is able to subscribe to a given event
   */
  events.on("Emitted", (address, amount)=>{
    console.log("Emitted event address : ", address);
    console.log("Emitted event amount : ", amount);
  });

  /**
   * Events with indexed properties are filtering enabled.
   * IndexedEventFilter is an example of manual filter. 
   * A solidity event can have up to 3 indexed parameter. The name of the function is the 4th indexed param
   * 
   * topics is an array of these indexed params. This array queries all events based on the positioned arguments in this array 
   * For example, The filter says give me all the IndexedEvent calls where first param is the signers[0].address
   * 
   * Smaller types must be padded to 32 bytes  
   *    
   * This could be also easily achived by using the filters class. 
   * See events.filters.IndexedEvent(signers[0].address) creates the same filter as  IndexedEventFilter
   */
  await events.connect(signers[0]).emitIndexedEvent(signers[1].address ,10);
  
  IndexedEventFilter = {
    address: events.address,
    topics: [
        ethers.utils.id("IndexedEvent(address,address,uint256)"),
        ethers.utils.hexZeroPad(signers[0].address, 32)
    ]
  };

  /**
   * Both queryFilter returns the same output:
   * [
        {
            blockNumber: 147,
            blockHash: '0xd3425a0c6d9c6d1d8c241aa8856a21093755abf0624dfae43f8f2cddfc19b711',
            transactionIndex: 0,
            removed: false,
            address: '0x91319c6267B7cD55f5E4308274F773d69f05F418',
            data: '0x000000000000000000000000000000000000000000000000000000000000000a',
            topics: [
            '0xe268b872a2629a81af3a59b3ff911385af114ea895fea597b2aa58c7f66cdfb5',
            '0x00000000000000000000000055e949311409d3a0f13912636bf6f3d13d037c82',
            '0x00000000000000000000000030cb8ada0ecb5392fa3addbe7524820aa083db13'
            ],
            transactionHash: '0x53b6bc61d47e3aecb102d56a1a29bda3d93dac217cea1d338ff59017ad327e0b',
            logIndex: 0,
            removeListener: [Function (anonymous)],
            getBlock: [Function (anonymous)],
            getTransaction: [Function (anonymous)],
            getTransactionReceipt: [Function (anonymous)],
            event: 'IndexedEvent',
            eventSignature: 'IndexedEvent(address,address,uint256)',
            decode: [Function (anonymous)],
            args: [
            '0x55E949311409D3a0F13912636Bf6F3D13D037C82',
            '0x30cb8aDa0ECb5392fA3ADDBE7524820AA083DB13',
            BigNumber { value: "10" },
            from: '0x55E949311409D3a0F13912636Bf6F3D13D037C82',
            to: '0x30cb8aDa0ECb5392fA3ADDBE7524820AA083DB13',
            value: BigNumber { value: "10" }
            ]
        }
     ]
   */

  // To query all the events based on the provided filter(s). Also block numbers can be specified to restrict the scope 
  console.log(await events.queryFilter(IndexedEventFilter));
  console.log(await events.queryFilter(events.filters.IndexedEvent(signers[0].address)));

  // The library also allows us to subscribe to the event with indexed properties. Note. A normal version without any indexable properties can also be created 
  events.on(IndexedEventFilter, (sender, receiver, amount)=>{
    console.log("IndexedEventFilter sender : ", sender);
    console.log("IndexedEventFilter receiver : ", receiver);
    console.log("IndexedEventFilter amount : ", amount);
  });

  // This give us the listerner count to a particular array.
  console.log("IndexedEvent ListnerCount: ", events.listenerCount(IndexedEventFilter)); // IndexedEvent ListnerCount:  1
  console.log("EmittedEvent ListnerCount: ", events.listenerCount("Emitted")); // EmittedEvent ListnerCount:  1

  // This give us the listerner subscribed to an event. This could be useful if we need to recycle.

  console.log("IndexedEvent Listner: ", events.listeners(IndexedEventFilter)); // [ [Function (anonymous)] ]
  console.log("EmittedEvent Listner: ", events.listeners("Emitted")); // [ [Function (anonymous)] ]

  // removing all listeners. This function is parameterised. We can simply pass a list of events. The default is all events 
  events.removeAllListeners()

  // All listeners are removed
  console.log("IndexedEvent ListnerCount: ", events.listenerCount(IndexedEventFilter)); // IndexedEvent ListnerCount:  0
  console.log("EmittedEvent ListnerCount: ", events.listenerCount("Emitted")); // EmittedEvent ListnerCount:  0
}

main()
