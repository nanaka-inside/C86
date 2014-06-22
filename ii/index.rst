
***********************************************
Immutable Infrastructureの最適解を探る(chapter用)
***********************************************


Immutable Infrastructureの最適解を探る
=====================================

失敗のないデプロイを目指して
-------------------------

* 失敗のないデプロイを行うためにIIが必要な理由を解く

* 継続的デリバリー
* II以前の世界のはなし

  * 設定が漂流する
  * flowerつながり
  * コラム Blue-Green Deplyment


作って壊す、そして自動化
----------------------

* 作って壊す(壊せる)利点をかく

* PhenixServer
* 芸術家は必要ない。工業プロダクトだ
* 気軽に壊してつくる環境
* amazonのデプロイ1000回のはなし
* この原稿での自動化の例


Immutable Infrastructure とは
-----------------------------

* 本番環境のサーバのセットアップの一般的手順
* II三層
  
  * Orchestration
  
    * Fabric, Capistrano, MCollective, Serf

  * Configuration

    * Puppet, Chef, AWS OpsWorks

  * Bootstrapping

    * Kickstart, Cobbler, OpenStack, AWS


* Blue-Green Deployment　(直接関係ないし)
* II以前の世界 (もうかいたし)
* IIの背景(もうかいたし)
* Immutable Infrastructure の利点(もうかいた？)


早速実践しよう
-------------

* serverspec

  * serverspecとは
  * 使ってみる
  * 利点

    * 本番サーバのSAN値検証に使えるので、jenkinsおじさんで１日１回まわす
    * zabbixとかと連携してみるとおもしろい？そんなことないか

* ansible

  * ansibleとは
  * 使ってみる
  * 利点欠点

* docker

  * dockerとは

    * ネットワークまわりとか、ディレクトリ関連がどうなるのかわからん。chrootでよくね？
    * FAQ形式で掘っていくのもよいかもね。じゃがいもよろしくー

  * 使ってみる


* vagrant

  * vagrantとは
  * 使ってみる

* ログの管理どうする？

  * fluentdを使って収集しましょう。いつでもサーバを壊せる状態にしておきましょう。
  * Elasticsearch + kibanaでログを可視化できてはっぴー☆

* DBどうするよ？

  * 気軽に壊せないので、こわさない。以上！！

* サーバの監視どうしよう

  * 気軽にこわせて気軽に立ち上がるサーバに名前をつけると大変なことに！！！
  * サーバに名前を付けることは悪であるという議論
  * hobbitとかzabbixとかそういうツールだと登録してるホストがなくなるとデータがなくなっちゃうんだよねー過去のトレンドが消えてしまうことが問題
  * mackerelを取り上げる。


CI as a Service
-----------------

* まだよくわかってない


まとめ
-------

* 本当にやりたいことは何だ？
* 未だもってみんな手探り状態
* おじさんのchef疲れ
* やりたいことを実現するためのツールが乱立している
* 新旧ツールをうまく組み合わせて事故のないデプロイをしていこう！


注目すべきトレンド
-----------------

* どくだんとへんけん
* hashicorp http://www.hashicorp.com/blog
* kief morris http://kief.com/
* Martin Fowler http://martinfowler.com/
* chad fowler http://chadfowler.com/
* 英語だけど翻訳すればよめなくはない。雰囲気をつかもう


参考文献
--------
「継続的デリバリー 信頼できるソフトウェアリリースのためのビルド・テスト・デプロイメントの自動化」アスキー・メディアワークス,2012


とりまとめついてない
------------------

* 必要なければdevopsに触れなくていっかなー
* 設定が漂流する。そこにIIを導入していくコスト。cultureは？
* IIが出てきた根源的な点はどこか？メリットが上回るものなのか？現状維持ではダメなのか？何故ダメになったのか？



壮大なメモ
----------

* PhenixServer : http://martinfowler.com/bliki/PhoenixServer.html

  * フェニックスサーバ。認証監査をしようと思った

    * 今動いている本番環境を再度構築しなおすことになる
    * 定期的にサーバを焼き払ったほうがいい
    * サーバは灰の中から不死鳥のように蘇る。だからフェニックスサーバという
    * 構成のズレ、アドホックな変更でサーバの設定が漂流する。SnowflakeServersにいきつく

      * http://kief.com/configuration-drift.html Configration Drift

    * このような漂流に対向するためにpuppetやchefをつかってサーバを同期し直す。
    * netflixはランダムにサーバを落として大丈夫か試している（ひー

* SnowflakeServer : http://martinfowler.com/bliki/SnowflakeServer.html

  * スノーフレークサーバ。雪のかけらサーバという存在
  * OSやアプリケーションにパッチを当てたりする必要がある
  * 設定を調査すると、サーバによって微妙に違う
  * スキー場にとっては良いが、データセンターではよくない
  * スノーフレークサーバは再現が難しい
  * 本番での障害を開発環境で再現させても調査できない
　
    * 参考文献・目に見えるOpsハンドブック　http://www.amazon.com/gp/product/0975568604
   
  * 芸術家はスノーフレークを好むのだそうだ　http://tatiyants.com/devops-is-ruining-my-craft/
　
    * （サーバ含めそのなかのアプリケーションも工業製品なんだよ！！！わかったか！！！（横暴
    * （昔はひとつのサーバでなんとか出来たけど、今はアクセスも増えてサーバも増えたので芸術品はいらない！！
    * （どーどー落ち着けー、なーー
　
  * スノーフレークのディスクイメージを造ればいいじゃんという議論
  * だがこのディスクイメージはミスや不要な設定も一緒に入っている
  * しかもそれを変更することもある。壊れやすさの真の理由となる（雪だけに
  * 理解や修正がしにくくなる。変更したら影響がどこに及ぶかわからない
  * そんなわけで古代のOSの上に重要なソフトウエアが動作している理由である
  * スノーフレークを避けるためにはpuppetやchefを使って動作の確認のとれたサーバを保持すること
  * レシピを使用すつと、簡単に再構築できる。または、イメージデータを作れる
  * 構成はテキストファイルだから変更はバージョン管理される

  * nologinにしてchefなどからレシピを実行すれば、変更はすべてログに残り監査に対して有効
  * 構成の違いによるバグを減らし、全く同じ環境をつくれる。また、環境の違いに起因するバグを減らせる

    * 継続的デリバリーの本に言及する　あっ

* ConfigurationSynchronization : http://martinfowler.com/bliki/ConfigurationSynchronization.html

  * あんまり重要じゃない

* ImmutableServer : http://martinfowler.com/bliki/ImmutableServer.html

  * やっともどってこれた。この文章からスノーフレークとフェニックスサーバに飛んでいる
  * Netflixが実は実戦でやってたみたい　AMIつくってそれをAWS上に展開している

    * http://techblog.netflix.com/2013/03/ami-creation-with-aminator.html
    * AMIを作るツール　https://github.com/Netflix/aminator#readme

