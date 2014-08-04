解説 Socket.IO 1.0
=====================

こんにちは。@sisidovskiと申します。普段は元気にPHPを書いています。

2014年はGoやSwiftなどが話題をかっさらっているのを感じますが、js界隈も盛り上がっています。altjsで天下一を決める人達 [#]_ がいたり、MVCフレームワークで天下一を決める人達 [#]_ がいたり。
Node.js界隈も色んな意味で盛り上がっていて、common.js関連やgruntやgulpなどのビルドツール [#]_ 、visionmedia(expressやmocha、jadeなどの作者)の勇退 [#]_ など、考えれば枚挙に暇がないがありません。

その中でも忘れてはならないのが、そうSocket.IO 1.0のリリースですね。2年以上待っていた方もいるのではないかと思います。 [#]_

待望のリリースということで、稚拙ながら解説させていただきます。

.. [#] http://connpass.com/event/6402/
.. [#] http://connpass.com/event/6910/
.. [#] 'Farewell Node.js' https://medium.com/code-adventures/farewell-node-js-4ba9e7f3e52b
.. [#] browserifyが年初あたりに話題になりましたね。
.. [#] 作者のGuillermo Rauchは、「東京Node学園祭 2011」での講演で、「次の2, 3ヶ月以内には1.0をリリースするつもりだ」と発言しています。55分30秒あたりです。http://www.nicovideo.jp/watch/1320664679


はじめに
---------

はじめにWebSocketプロトコルやSokcet.IOに関して簡単に解説し、本題のSocket.IO 1.0における変更点、新機能などの説明に入っていきます。WebSocketなんて説明不要だという方は、適宜読み飛ばしてください。


WebSocketとは
^^^^^^^^^^^^^^

WebSocketプロトコルについてはRFC6455 [#]_ [#]_ に書かれている通りですが、ちょっと説明しておきますと、サーバ・クライアント間における双方向通信用の技術規定であり、TCP上で動くプロトコルです。リクエスト・レスポンス形式に沿った従来の通信とは異なり、WebSocketは一度コネクションを張った後は必要な通信を全てそのコネクション上で行うことにより、サーバからクライアントへのプッシュ配信が可能になっています。

  The goal of this technology is to provide a mechanism for browser-based applications that need two-way communication with servers that does not rely on opening multiple HTTP connections (e.g., using XMLHttpRequest or <iframe>s and long polling).

とRFCにもある通り、WebSocketはXHRやCommet等が持つ問題（コネクションを確立するのにHTTP通信を何度も行うことや、ロングポーリング問題）を解決しつつ、双方向通信を実現することを目標にしています。WebSocketを確立するフローとしては、以下のようになります。

#. クライアントからハンドシェイク要求を送る
#. サーバー側はその要求をHTTPとして解釈し、WebSocketへと切り替えて応答を返す(Upgrade)
#. コネクションが確立する

.. [#] http://tools.ietf.org/html/rfc6455
.. [#] 日本語訳はこちらで読めます http://www.hcn.zaq.ne.jp/___/WEB/RFC6455-ja.html


Socket.IOについて
^^^^^^^^^^^^^^^^^^^

しかしながら、双方向通信はいかなる場合もWebSocketが利用できるわけではありません。通信状況やクライアントの仕様によってはWebSocket以外の手段で通信が行われる場合もあるでしょう。そこでSocket.IOです。
Socket.IOを利用することで、双方向通信の確立方式、実装の違いを考えることなく、プログラマはアプリケーションの開発に集中することができます。その他、ルーム分割の機能や、認証機能、Redis等を利用してプロセス間の共有なども可能になっています。Socket.IOおよびEngine.IO（後述）は、双方向通信における様々の実装を隠蔽し、共通のインターフェースで開発ができるリアルタイムアプリケーション向けのライブラリ、と言うことができるでしょう。


Socket.IO 1.0における主な変更点
----------------------------

5月末にリリースされた1.0ですが、次のような変更点があります。

* トランスポート層の実装をEngine.IOに移譲した
* バイナリデータの送信をサポートした
* ブラウザテストを自動化した
* スケーラビリティが向上した（よりシンプルになった）
* バックエンドでのSocket.IO連携が可能になった
* デバッグしやすくなった
* APIがよりシンプルになった
* CDN配信を提供することにした

上記変更点はリリース時のブログ [#]_ で言及されていますが、主要な部分を解説します。　

.. [#] http://socket.io/blog/introducing-socket-io-1-0/

トランスポート層の実装をEngine.IOに移譲した
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Engine.IOは、ざっくばらんに言うと「Websocketでもhttp pollingでも何でもいいからとにかく通信できる状態を確立する」ライブラリです。以前は通信に関する部分もSocket.IOが内包していましたが、1.0からはそれらの機能をEngine.IOに移譲し、Socket.IOはルーム機能や接続要求などの、より高度な機能のみ実装されるようになりました。実際、Socket.IO自体のコードはサーバ、クライアントそれぞれ1000行前後と大幅にシンプルになりました。また、Engine.IOは通信方式に関わらずWebSocketとして利用できるインターフェースを提供してくれるので、仮にWebSocketのみをサポートするのであれば、Engine.IOを利用せずともSocket.IOは問題なく動作できるという指針のもと開発されています。

また、接続の確立方法がfallback形式からupgrade形式に変更になりました。

**従来のfallback形式**

- WebSocketでの接続試行
- 成功したら終了
- 失敗した場合はタイムアウトを待つ（デフォルトは10秒）
- その後http pollingで再試行する

**新しいupgrade形式（ここで言うupgradeとは、http polingからWebSocketへのupgradeを指します）**

- http pollingでリクエストを行い、接続を確立する
- 並列でupgradeできるか判定する
- 設定によりupgradeせずに終了する
- pollingしたままWebSocketでパケット通信できるか試行する
- WebSocketでの通信に成功したら、メインのトランスポートを変更する

WebSocketの接続が確立できないということは、サービスを運営する中で、確かにしばしば見られました。この原因に関しては、0.9時代に調査がなされ（ソース見つからず [#]_ ）、ブラウザの問題というよりはプロキシやファイアウォールによってWebSocketの通信が阻まれることが多いと結果になりました。従来のfallback形式だと、構造的に接続確立までに大幅な時間を要することが避けられないという問題を孕んでいましたが、今回新たにupgrade方式を取ることによって、http pollingによる接続確立とWebSocketによる通信確立を平行して行うので、ユーザ体験を損なうことなく、タイムアウトして接続確立に時間がかかってしまう問題を解消しています。

「WebSocket対応できてない環境は対応しないんだけど」「クライアントを作るとしたらWebSocket対応だけじゃだめ？」という疑問が湧きますが、問題ありません。クライアントから接続するときにtrasportsオプション [#]_ に配列を渡してやることで対応できます。::

  // デフォルトの場合
  var socket = io('http://localhost:3000');
  socket.on('connect', function() {
    console.log(socket.io.engine.transport);   // xhr
    setTimeout(function() {
      console.log(socket.io.engine.transport); // ws
    }, 3000);
   });

  // WebSocketのみで通信する場合
  var socket = io('http://localhost', {
    transports: ['websocket']
  });
  socket.on('connect', function() {
    console.log(socket.io.engine.transport)     // ws
    setTimeout(function() {
      console.log(socket.io.engine.transport);  // ws
    }, 3000);
  });


.. [#] デフォルトでは transports = ['polling','websocket'] https://github.com/Automattic/socket.io-client/blob/b537b8edf9494f08c81ba83948591c1cb961305f/socket.io.js#L1459
.. [#] wikiでの記載が以前はあったはずですが、ドキュメントを1.0に移行するタイミング？で消えてしまったようです。 https://github.com/Automattic/socket.io/issues/1259


バイナリデータの送信をサポートした
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

バイナリデータ送信のサポートは、実運用上はそこまで大きな機能追加とは思えませんが、1.0アップデートの中でもインパクトのあったものではないでしょうか。

WebSocketプロトコルは既にバイナリデータの送信をサポートしていますが、0.9までのSocket.IOではそれがサポートされていませんでした。0.9以前のバージョンでバイナリデータを送信したいときは、お馴染みのbase64化をしてあげる必要があり、データ量としても実装としても、あまり効率のいいものとはいえなかったかと思います。今回1.0のリリース時で対応され、プロトコルでは実装されているのにライブラリの制約で利用できないという冬の時代は終わりを迎えました。しかも、Socket.IOでのバイナリ送信はWebSocketによって定められたそれより使いやすくなっています。

WebSocketのバイナリフレームはBlobかArrayBuffer形式で送受信することが可能です。しかしながら、その他の形式には対応していなかったり、送信時にstring modeなのかbinary modeなのか明示する必要があったりと、決して使い勝手が良いとは言い難い部分もあります。Socket.IOはこれらの問題を解決しており、BufferやFileといったデータの送信もサポートしています。また、それを明示する必要もありません。複数のバイナリを同時に送受信することや、オブジェクトの中に埋め込んだりすることも可能です。

以下に0.9と1.0で画像データを送受信するサンプルを示します。::

  // 0.9
  // client
  var input = document.getElementById('type_file')
  input.addEventListener('change', function(e) {
    var fileList = e.target.files,
        file     = fileList[0],
        reader = new FileReader();
    reader.onload = function(e) {
      socket.emit('image_from_client', e.target.result);
    };
    reader.readAsDataURL(file);
  });
  // server
  socket.on('image_from_client', function(data) {
    // 適当な処理。場合によってデコードが必要
  });

  // 1.0
  // client
  var input = document.getElementById('type_file')
  input.addEventListener('change', function(e) {
    var fileList = e.target.files,
        file     = fileList[0];
        reader   = new FileReader();
    reader.onload = function(e) {
      socket.emit('image_from_client', e.target.result);
    };
    reader.readAsArrayBuffer(file);
  }, false)
  // server
  socket.on('image_from_client', function(buf) {
    // デコードせず処理が書ける
    socket.emit('image_from_server', buf);
  });
  // client
  socket.on('image_from_server', function(buf) {
    var view = new Uint8Array(buf),
        blob = new Blob([view], {type: 'image/jpg'}),
        url  = URL.createObjectURL(blob),
        elm  = document.createElement('img')
                       .setAttribute('src', url);
    document.body.appendChild(elm);
  });

クライアントで扱う部分に限っては、base64エンコードした文字列を送受信する方が（慣れているという側面もありますが）使いやすく感じました。転送量やパフォーマンスをあまり気にする必要がないのであれば、無理にBlobやArrayBufferで扱う必要もないかもしれません。サーバ側でデータを保存・加工する場合は、やはりバイナリ送信ができた方がラクかと思います。

余談ですが、xhr2に対応していない環境であるか、もしくはオプションでforceBase64を指定した場合は、バイナリデータはbase64エンコードした状態で通信されます。透過的に扱うことができて便利にも思えますが、意図しない挙動を産むかもしれないので、注意が必要ですね。あと、公式にバイナリ送信を検証するために作成されたポケモンのクローン [#]_ やwindows XPのサンプル [#]_ が面白いです。

.. [#] http://weplay.io/
.. [#] http://socket.computer/


スケーラビリティが向上した（よりシンプルになった）
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Socket.IO(+Node.js)で大規模なチャットアプリケーションなどを実装するのは、少々骨の折れる作業でした。Node.js自体はシングルスレッドで動作するため、多くのリソースを消費するプログラムを書くとたちまちレスポンスは遅延しますし、CPU性能を十分に発揮できません。このような場合はcluster moduleとsticky sessionを組み合わせたり、プロセスマネージャとしてpm2、passangerなどを利用して、複数プロセスでアプリケーションを起動し、nginxをフロントに置いて振り分けたりする構成が一般的かと思われます。

マルチプロセスでアプリケーションを運用する場合、プロセス間でセッション情報の共有が必須になってきます。0.9までのSocket.IOの場合、Storeという機能でRedisのPub/Subを用いる機能が一般的でしたが、1.0からはAdapterという機能を利用して実現するようになっています。

0.9までのRedisStore::

  var io    = require('socket.io').listen(3000),
      redis = require('socket.io/lib/stores/redis'),
      opts  = {
        host: 'localhost',
        port: 6379
      };
  io.set('store', new redis({
    redisPub: opts,
    redisSub: opts,
    redisClient: opts
  }));

0.9まではRedisStoreとしてSocket.IOに内包されていましたが、1.0からは本体から切り離され、別途インストールする必要があります。ちなみに、デフォルトはメモリストアですが、そちらもSocket.IO-adapterとして切り離されています。

1.0でのRedisAdapter::

  var io    = require('socket.io')(3000),
      redis = require('socket.io-redis');
  io.adapter(redis({
    host: 'localhost',
    port: 6379 
  }));

かなりシンプルになりましたが、これだけでプロセス間のやり取りは可能です。pubClient/subClientなどはオプションで指定することもできます。また、Socket.set()やSocket.get()はdeprecatedになったので、0.9からのバージョンアップ時には気をつけなければならないかもしれません。

0.9までは、プロセス間で共有するクライアントの接続データをプロセスがそれぞれ保持していましたが、1.0以降は、プロセス間でデータの多重保持は行わないような設計になっています。今まで全クライアントのデータをそれぞれのプロセスが持っていたわけですから、決して効率的だとはいえず（これはこれで利点でもあるとは思いますが）、今回の変更によりスケーラビリティの向上が見込まれます。

バックエンドでのSocket.IO連携が可能になった
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

1.0からは、Socket.IOサーバ単体、もしくはNode.jsを利用した場面以外にも、どこからでもSocket.IOサーバにイベントを送ることができるようになりました。本体には同梱されていませんが、socket.io-emitterというプロジェクトがその役割を果たします。例えば、別プロセスで他のプログラムが処理を実行し、Socket.IOには双方向通信の役割のみに専念させたい場合や、既存のアプリケーションにSocket.IOサーバを組み込みたい場合などに便利でしょう。Ruby [#]_ , PHP [#]_ , Go [#]_ などによる実装が既に公開されていますし、学習も兼ねて自分で作ってしてしまうのもよさそうだな、と個人的に考えています。例えば、Ruby版の実装は実質70行もありません。

.. [#] https://github.com/nulltask/socket.io-ruby-emitter
.. [#] https://github.com/rase-/socket.io-php-emitter
.. [#] https://github.com/yosuke-furukawa/socket.io-go-emitter

その他の変更点
-------------

1.0リリース時に言及された主要な変更点について見ていきましたが、他にもいくつか考慮すべき機能追加、および変更点があります。

middleware
^^^^^^^^^^^^^
普段expressを触っている人には馴染み深いですが、Socket.IOにもmiddlewareが導入されました。クライアントのハンドシェイクから接続確立までの間に認証やその他の処理を実行することができます。0.9まではauthorizationがこの機能を果たしていましたが、authorizationはあくまで認証用の機能でした。セッション管理のサンプルでコードの違いを確認してみましょう::

  // 0.9
  io.set('authorization', function(handshakeData, callback) {
    var _cookie   = decodeURIComponent(handshakeData.headers.cookie);
    var cookie    = require('cookie').parse(_cookie);
    var sessionId = cookie['key'];
    if (sessionId) {
      handshakeData.sessionId = sessionId;
      callback(null, true);
    } else {
      callback('error', false);
    }
  });
  io.on('connecttion', function(socket){
    var sessionId = socket.sessionId
    // some code
  });

これに対して、middlewareはいくつでも処理を挟むことができます。namespaceを利用して一部のリソースのみに適用することもできます。エラー判定は、nextコールバックにエラーオブジェクトを渡してあげればよいです。また、この変更によりio.set()、io.get()はdeprecatedになりますので、ご注意ください。::

  // 1.0
  var count = 0;
  io.use(function(socket, next) {
    var _cookie   = socket.request.headers.cookie;
    var cookie    = require('cookie').parse(_cookie);
    var sessionId = cookie['key'];
    if (sessionId) {
      socket.sessionId = sessionId;
      next();
    } else {
      next(eror);
    }
  });
  io.use(function(socket, next) {
    count++; // 1
    next();
  });
  io.use(function(socket, next) {
    count++; // 2
    next();
  });
  io.on('connecttion', function(socket){
    var sessionId = socket.sessionId
    // some code
  });


よく使うメソッドがより使いやすくなった
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
いくつかのメソッドにはショートカットが用意されています。0.9までの使い方でも問題ありません。
  
全クライアントへブロードキャスト::

  // 0.9
  io.sockets.emit('eventName', data);
  // 1.0
  io.emit('eventName', data);

Socket.IOサーバの起動::

  // 0.9
  var io = require('socket.io');
  var socket = io.listen(80, {});
  // 1.0
  var io = require('socket.io');
  var socket = io({});

まとめ
------
駆け足でしたが、Socket.IO 1.0についての主な変更点について解説させていただきました。リリースされてからまだ日が浅いですが、そろそろプロダクションで1.0が動くサービスも出てくるのではないでしょうか。この記事が読者の方々の開発に貢献できたら幸いです（自分が扱っているプロダクトも1.0にバージョンアップしなければ...）。