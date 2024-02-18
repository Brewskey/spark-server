<pre>
    ____             __  _      __        ______      _____     __         
   / __ \____ ______/ /_(_)____/ /__     / ____/___  / / (_)___/ /__  _____
  / /_/ / __ `/ ___/ __/ / ___/ / _ \   / /   / __ \/ / / / __  / _ \/ ___/
 / ____/ /_/ / /  / /_/ / /__/ /  __/  / /___/ /_/ / / / / /_/ /  __/ /    
/_/    \__,_/_/   \__/_/\___/_/\___/   \____/\____/_/_/_/\__,_/\___/_/      
</pre>     

This is a stress testing framework for the local cloud (spark-server). It is
a great way to test the stability of your server or cluster of servers.

Features:
* Generate virtual devices - These will register their public keys on your
server and get claimed under a test account.
* Call functions/variables on virtual devices - This will randomly send off
to your cloud which will communicate with your devices.
* Call webhooks on virtual devices - This will randomly call webhooks from the
virtual devices which will hit your cloud.
* Chaos-Monkey - Randomly run webhooks/functions/variables and continuously add
and remove devices.  Use this to really give your server a thrashing.
