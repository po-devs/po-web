import {afterLoad as webclient} from "./webclient";
import {afterLoad as channelList} from "./channels/channellistui";
import {afterLoad as playerList} from "./playerlistui";
import {afterLoad as chat} from "./chat";
import {afterLoad as pms} from "./pms/pmlistui";
import {afterLoad as battles} from "./battles/battlelistui";

export default function() {
  chat();
  playerList();
  channelList();
  pms();

  //Need to be last because it joins a channel, at least needs to be after channelList()
  webclient();
};
