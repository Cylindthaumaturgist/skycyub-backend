export function randomProfileID() {
	const profileIds = ["spinach", "lettuce", "cabbage", "carrot", "beetroot", "potato", "garlic", "broccoli", "celery", "tomato", "cucumber", "peas", "onion", "ginger", "cauliflower", "asparagus", "eggplant", "pumpkin", "corn", "beans"];
  const random = Math.floor(Math.random() * profileIds.length);
      
  return profileIds[random];
}

export function newPlayerTemplate(name) {
	const profileId = randomProfileID();
	
	return {
    "name": name,
    "purchase_history": [],
    "gems": 0,
    "rank": "default",
    "selectedProfile": profileId,
    "profiles": {
      [profileId]: {
        "mode": "normal",
        "isCoop": false,
        "purse": 0,
        "location": "private_island",
        "inventory": [
          {
            "where": "hotbar",
            "index": 8,
            "item": {
              "skycyubItemType": "item",
              "type": "minecraft:nether_star",
              "name": "Skycyub Menu",
              "id": "skycyub_menu",
							"stat": {},
              "lore": [],
              "rarity": "NULL",
              "onUse": "skycyub.native.items.brain.onuse.skycyub_menu",
              "misc": {
								"isPermanent": true,
                "canSell": false
							}
            }
          }
        ],
        "player": {
          "skills": {
            "combat": {
              "level": 0,
              "exp": 0,
              "requiredExp": 1
            },
            "farming": {
              "level": 0,
              "exp": 0,
              "requiredExp": 1
            },
            "mining": {
              "level": 0,
              "exp": 0,
              "requiredExp": 1
            }
          },
					"collections": {
            "combat": {
              "rotten_flesh": {
                "level": 0,
                "totalCollected": 0
              }
            },
            "farming": {
              "wheat": {
                "level": 0,
                "totalCollected": 0
              },
              "seeds": {
                "level": 0,
                "totalCollected": 0
              },
              "carrot": {
                "level": 0,
                "totalCollected": 0
              }
            },
            "mining": {
              "stone": {
                "level": 0,
                "totalCollected": 0
              },
              "coal": {
                "level": 0,
                "totalCollected": 0
              }
            }
          },
          "level": 0,
          "exp": 0,
          "stats": {
            "health": {
              "current": 100, 
              "max": 100
            },
            "defence": 0,
            "strength": 0,
            "speed": 100,
            "intelligence": 0
          },
					"storage": {
            "enderchests": [{}]
          },
          "misc": {
            "mobKills": {}
          }
        },
        "bank": {
          "balance": 0,
          "history": [],
          "interest": 0,
          "upgrade": "BASIC"
        },
        "placesUnlocked": [],
        "createdAt": new Date().toISOString()
      }
    }
  };
}

