import {afterLoad as webclient} from "./webclient";
import {afterLoad as channelList} from "./channels/channellistui";
import {afterLoad as playerList} from "./playerlistui";
import {afterLoad as chat} from "./chat";
import {afterLoad as pms} from "./pms/pmlistui";
import {afterLoad as battles} from "./battles/battlelistui";
import {afterLoad as utils} from "./utils";

export default function() {
  utils();
  chat();
  playerList();
  channelList();
  pms();
  battles();

  //Need to be last because it joins a channel, at least needs to be after channelList()
  webclient();
}
