
Immutable Infrastructureの最適解を探る 
=====================================

筆者の@tbofficeです。某webサービス的な会社でインフラ的なお仕事をやりつつ、裏では同人誌を書いています。

さて、本記事では、2014年のインフラ界のバズワードである「Immutable Infrastructure」(以下、IIと略します)を取り上げます。
まずは、IIが生まれた背景と思想について、もう一つは、IIを実現するために使えるツール(Ansible, Vagrant, Docker, Surfなど)を実際に使ってみて、最適解を探ります。


まず、こちらをご覧ください
-------------------------------

.. figure:: img/appprotweet.eps
  :scale: 70%
  :alt: appprotweet
  :align: center

  やめて！！(https://twitter.com/skoji/status/392588415473963008)


次にこちらをご覧ください
----------------------

.. figure:: img/condel.eps
  :scale: 50%
  :alt: condel
  :align: center

  いつまで手動でデプロイしているんですか？

:: 

   ＿人人人人人人人人人人人人人人人人人人人人人人＿
   ＞　いつまで手動でデプロイしているんですか？　＜
   ￣Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y￣

この本については、後ほど触れることにしましょう。


あわせて読みたい
---------------

CHad Fowler氏 [#iichad]_ の「サーバを捨てて、コードを焼き付けろ！」 [#iitys]_ [#iitys2]_ というブログ記事があります。
その記事のJunichi Niino氏による邦訳 [#iihottan]_ を引用してみましょう。

  開発者として、あるいはしばしばシステム管理をする者として、これまで経験したもっとも恐ろしいものの1つは、長年にわたり稼働し続けてなんどもシステムやアプリケーションのアップグレードを繰り返してきたサーバだ。

  なぜか。その理由は、古いシステムはつぎはぎのような処置がされているに違いないからだ。障害が起きたときに一時しのぎのハックで対処され、コンフィグファイルをちょこっと直してやり過ごしてしまう。「あとでChefの方に反映しておくよ」とそのときは言うけれど、炎上したシステムの対処に疲れて一眠りしたあとでは、そんなことは忘れてしまうだろう。

  予想もしないところでcronのジョブが走り始めて、よく分からないけれどなにか大事な処理をしていて、そのことを知っているのは関係者のうちの1人だけとか。通常のソースコード管理システムを使わずにコードが直接書き換えられているとか。システムがどんどん扱いにくくなっていき、手作業でしかデプロイできなくなるとか。初期化スクリプトがもはや、思いも付かないような例外的な操作をしなければ動かなくなっているとか。

  もちろんOSは（きちんと管理されているならば）なんども適切にパッチが当て続けられているだろうが、そこには（訳注：やがて秩序が失われていくという）エントロピーの法則が忍び込んでくるものだし、適切に管理されていないとすればいちどもパッチは当てられず、もしこれからパッチを当てようものならなにが起きるか分からない。

.. [#iichad] https://twitter.com/chadfowler
.. [#iitys] 邦題は@naoya氏の「Immutable Infrastructure Conference #1」の発言から引用
.. [#iitys2] 「Trash Your Servers and Burn Your Code: Immutable Infrastructure and Disposable Components」http://chadfowler.com/blog/2013/06/23/immutable-deployments/
.. [#iihottan] このへんの流れは、 Junichi Niino氏の「『Immutable Infrastructure（イミュータブルインフラストラクチャ）と捨ててしまえるコンポーネント』 チャド・ファウラー氏」http://www.publickey1.jp/blog/14/immutable_infrastructure.html　を参考にしました。っていうかほぼそのまま

どんどん変更を加えていったことによって、その全容を知る者がいなくなってしまったシステムの誕生です。


継続的デリバリー
---------------

先ほど、「いつまで手動でデプロイしているんですか？」というマサカリを投げてきた本は「継続的デリバリー 信頼できるソフトウェアリリースのためのビルド・テスト・デプロイメントの自動化」 [#iikz]_ (以下、「継続的デリバリー」と略します)です。この本は、ソフトウエアをユーザにできるだけ早く届ける方法が書かれています。

.. [#iikz] http://www.amazon.co.jp/dp/4048707876


作って壊す、そして自動化
----------------------

Martin Fowler氏のブログに、PhoenixServer [#iifs]_ という記事があります。不死鳥のように蘇るサーバという意味です。
お仕事で動作中のサーバの監査行ったとき、本番と同じサーバを作ろうとしたところ、構成のズレやアドホックな変更でサーバの設定が「drift」(漂流)していたそうです [#iisfs]_ 。
だったらいっそのこと定期的にサーバを焼き払ったほうがよく、puppetやchefを使ってサーバを作り直そうと書かれています。

.. [#iifs] http://martinfowler.com/bliki/PhoenixServer.html
.. [#iisfs] そんなサーバのことを SnowflakeServer(雪の欠片サーバ) という http://martinfowler.com/bliki/SnowflakeServer.html

「継続的デリバリー」の中でも重要な事として **自動化** が何度も登場します。自動化すれば作り直しが簡単にできます。
また、自動化を推し進めると、コードのテストから、バグの修正や機能の拡張を本番サーバにデプロイするまでがほぼ自動となり、デプロイの回数を増やすことができます。

2012年に行われたカンファレンス、AWS re:Inventにて「Amazonは1時間に最大1000回もデプロイする」 [#iideploy]_ という講演がありました。
そのなかで、「Amazon.comでは11秒ごとに新しいコードがデプロイされている。そして最も多いときで1時間に1079回デプロイが行われた。
これには機能追加だけでなくバグフィクスなども含まれるが。平均で1万、最大で3万ものホストがデプロイを受け取る」とあります。
これは、バグはすぐに潰され、機能の追加の恩恵も受けられることを示します。このサイクルを行うために、継続的デリバリーでも強調されている **自動化** が必須となります。

.. [#iideploy] http://www.publickey1.jp/blog/12/amazon11000_aws_reinventday2_am.html
.. [#iighedep] GitHub 時代のデプロイ戦略 http://d.hatena.ne.jp/naoya/20140502/1399027655


そうはいっても
^^^^^^^^^^^^^^

確かに壊して作りなおすと言っても、いまさらできないよ・・・時間があればできるけど、それをやっている隙がないということもあるでしょう。
そいういう場合は、ルーチンで行っていることを自動化しましょう。たとえばコードのテストの自動化であったり、デプロイの準備などです。
いつか来る、すべてのシステムの作り直しの時がくるまでに準備しておきましょう [#souhaittemo]_ 。

.. [#souhaittemo] 作り直しの時がこないって？そんなシステムは老朽化がきて、サービスをやめようという判断になるので、そのまま捨てましょう（ぇー


サーバのセットアップの一般的手順
-----------------------------

IIの説明をするまえに、我々は何を自動化したいのかを明確にしておきましょう。例えばサーバのセットアップの一般的手順を示すと下記のようになります [#iisetup]_ 。

* データセンターにサーバを設置してケーブリング [#iicable]_ 。またはインスタンスを立ち上げ
* OSをインストール [#iigoldenimage]_ 
* ミドルウエアをインストールして設定ファイルを書く
* プログラムをデプロイ
* プログラムの動作を確認
* 監視ツールに登録
* DNSに登録
* LBに登録

.. [#iisetup] Serf という Orchestration ツール #immutableinfra http://www.slideshare.net/sonots/serf-iiconf-20140325 の14ページを参考にしました
.. [#iigoldenimage] ゴールデンイメージってやつもあるけど各自ぐぐってね！
.. [#iicable] 自動化無理。でもできると嬉しい


Immutable Infrastructure を導入
-------------------------------

いよいよ本題のIIに入ります。

IIの三層
--------

とっつきやすいのでIIの三層の話から入ります。mizzyさんの記事 [#iimi1]_ で三層の話がでてきます。この記事の参照先 [#ii3lay1]_ のPDF [#ii3lay2]_ を引用します [#ii3lay3]_ 。

.. [#iimi1] インフラ系技術の流れ - Gosuke Miyashita - http://mizzy.org/blog/2013/10/29/1/
.. [#ii3lay1] Provisioning Toolchain: Web Performance and Operations - Velocity Online Conference - March 17, 2010 - O'Reilly Media - http://en.oreilly.com/velocity-mar2010/public/schedule/detail/14180
.. [#ii3lay2] Open Source Provisioning Toolchain - http://cdn.oreillystatic.com/en/assets/1/event/48/Provisioning%20Toolchain%20Presentation.pdf
.. [#ii3lay3] このスライドは、もともとToolchainの話をしています。Toolchainとはソフトウエアを作る生産ラインみたいなものです。たとえば「emacs->autoconf->autoheader->automake->libtool->gcc->ld」

.. figure:: img/3layer.eps
  :scale: 100%
  :alt: 3layer
  :align: center

  IIの三層

サーバをセットアップする生産ラインとしてこの３つの層がでてきます。矢印の方向に向かって、ベルトコンベアのようにサーバがセットアップされる様子を表しています。

* Orchestration　[#iisurf00]_ 
  
  * アプリケーションのデプロイ
  * 使われるツールやソフトウエア：Fabric, Capistrano, MCollective

* Configuration

  * ミドルウエアのインストールや設定
  * 使われるツールやソフトウエア：Puppet, Chef, AWS OpsWorks, Ansible

* Bootstrapping

  * OSのインストールやVM,クラウドのイメージの起動
  * 使われるツールやソフトウエア：Kickstart, Cobbler, OpenStack, AWS


どの層でどのようなことをやるかについて、正確な定義はありません。ただし、どの層で何をやるのか決めておかないと手間が増えます。たとえば、kickstartでOSのユーザを作って、さらにChefでも同じユーザを作ろうとしてレシピが失敗することがあります。

.. [#iisurf00] Orchestrationからしれっと Surf を消してますが、まあ無視しましょう

以上は三層で終わっていますが、本誌ではそれに付け加えて２つの層を設定します。

* Agent
  
  * 外部サービスに自分を登録
  * 使われるツールやソフトウエア：Serf

* Test

  * デプロイされたプログラムの動作を確認
  * 使われるツールやソフトウエア：Serverspec


どうでしょうか [#ii]_ 。ここまでくると、先ほどの「サーバのセットアップの一般的手順」を網羅できました [#iiyarukoto]_ 。

.. [#ii] このTestとAgentをOrchestrationに含めてもいいんですけどOrchestrationが頭でっかちになるんですよね [脳内調べ]
.. [#iiyarukoto] 初期コストかけて自動化の状態に持って行ってそこからあとは楽になる...と考えていた時期がありました(このへん、大きな問題だったり...)


早速実践してみよう
----------------

IIの三層+二層をひと通り実践してみましょう。まずはServerspecから始めていきます。
Serverspecから始める理由は、手始めにやるにはうってつけだからです。サーバのデプロイはchefでもAnsibleでもbashスクリプトでも手動でコマンドを打てば構築できます。
問題はそのあとです。誰がどうやって、そのサーバが正しくセットアップできているか調べるのか？そこを担保するため、Serverspecを使います。


動作確認するためにServerspec
^^^^^^^^^^^^^^^^^^^^^^^^^^

Serverspec [#iiscurl]_ とは、ruby製のツールで、Rspec [#iirspec]_ を拡張したものです。ssh経由でOSの内部の状態をチェックすることができます。インストールは、ruby, gem, bundler [#iirsa]_ がインストールされている環境で、serverspec用の適当なディレクトリを作ります。その中にGemfileを置きます。中身は下記です。

.. [#iiscurl] http://serverspec.org/
.. [#iirspec] http://rspec.info/
.. [#iirsa] bundler は、 ``sudo gem install bundler`` でインストールします。

:: 

   source 'https://rubygems.org'
   gem 'serverspec'

そのあと、同じディレクトリで ``bundle`` コマンドを打てばインストール完了です。次に、 ``serverspec-ini`` でひな形ファイルを生成します。
すると、 ``spec/localhost/httpd_spec.rb`` というスペックファイルができあがります。見てみましょう。

.. code-block::ruby

   require 'spec_helper'
   
   describe package('httpd') do
     it { should be_installed }
   end
   
   describe service('httpd') do
     it { should be_enabled   }
     it { should be_running   }
   end
   
   describe port(80) do
     it { should be_listening }
   end
   
   describe file('/etc/httpd/conf/httpd.conf') do
     it { should be_file }
     its(:content) { should match /ServerName www.example.jp/ }
   end

このspecファイルは、httpdに関連したファイルです。httpdのパッケージがインストールされているか、OS起動時に起動しているか、プロセスが起動しているか、80番ポートをlistenしているかなどをチェックします。なお、localhostにsshで入れる設定であれば、このまま自分自身のテストができます [#iijibun]_ 。

チュートリアルで作ったこのテスト(specファイル)は、1つのサーバに対応しています。複数のサーバをまとめてチェックするものがないかなーと探していたらありました [#iiscd]_ [#iiscdbun]_ 。使ってみましょう。

.. code-block:: sh

   $ git clone git@github.com:dwango/serverspecd.git
   $ cd serverspecd
   $ bundle

hosts.ymlにホスト名とチェックするrolesを書いて、attributes.ymlにroleに与えるパラメーターを書きます。
たとえば自分が所有しているvpsにテストをかけてみましょう。まずは、sshでノンパスで入るために ``.ssh/config`` を設定。公開鍵は別途登録して下さい。

.. code-block:: conf

   Host nico
     HostName        nico.example.com
     Port            2525
     IdentityFile    ~/.ssh/id_rsa
     User            nico

attributes.yml.templateとhosts.yml.templateをリネームしてhosts.ymlを変更。こんな感じです。

.. code-block:: sh

   $ cp attributes.yml.template attributes.yml
   $ cp hosts.yml.template hosts.yml
   $ cat hosts.yml
   nico:
     :roles:
        - os
   maki:
     :roles:
        - os
        - network

設定を見てみましょう。サーバの一覧が並びます。

.. code-block:: sh

   % rake -T                              
   (in /home/chiba/repo/serverspecd)
   rake serverspec       # Run serverspec to all hosts
   rake serverspec:maki  # Run serverspec to maki
   rake serverspec:nico  # Run serverspec to nico

テスト実行してみます。成功したテストは ``.``  、失敗したテストは ``F`` で表示されます。失敗したテストの理由が表示されます。どんなコマンドを実行したか出るので、デバックするときに使います。

.. code-block:: sh

   $ rake serverspec:nico
   (in /home/chiba/repo/serverspecd)
   /usr/local/bin/ruby -S rspec spec/os/os_spec.rb
   .FFFFFFFFF..FF...F.F....FFFFFF........F.........FF..FF..FFFF....F....F..F.
   
   Failures:
   (以下略)

なお、attributes.ymlのosのセクションにパラメータが、テストは ``spec/os/os_spec.rb`` にあります。phpやmysqlのテストも同梱したので、使いたい人は使ってやって下さい。

Serverspecで重要なのは、何をテストするかということです。なるべく重複するテストの数を少なくするのがおすすめです。これをチェックすれば、複数の項目がチェックできるテストが良いです [#iisstest]_ [#iisstest2]_ 。
応用としては、開発サーバや本番サーバのSAN値 [#iisanti]_ のチェックをしてみましょう。
具体的には、Jenkins [#iijenkins]_ おじさんを使って1日1回程度テストを回して、入ってはいけないパッケージを見つけたり、別のサーバへの疎通ができているかをチェックしましょう [#iiscn]_ 。
テストを書くのはだるいですが、一度やっておけば、バグや障害を検出することができますので、是非やりましょう。

.. [#iiscd] https://github.com/dwango/serverspecd 「d」とついているからといって、デーモンではありません
.. [#iiscdbun] bundleコマンドがなければ、``gem install bundler`` でインストールして下さい。``gem`` がなかったらrubyをインストールして下さい
.. [#iijibun] 自分自身といっても人ではなく、サーバのことです。自分のテストは健康診断にでも行って下さい(執筆時期が丁度そんな時期)
.. [#iisstest] 細かくすれば、テスト＝解決する問題となってわかりやすいんですけどね。テスト増えると管理が大変になると思う。でもテスト項目が多いと、テスト中の「....」が増えるので、見ていて面白い
.. [#iisstest2] 「Jenkinsで動かすとそれ、見えなくね？」「こ、コンソールで見ればいいし(震え声」「ん？　君、自動化って言ったよね？」
.. [#iisanti] SAN値とは、正気度を表すパラメーターのことである - http://dic.nicovideo.jp/a/san値
.. [#iijenkins] http://jenkins-ci.org/ Jenkins CI。継続的デリバリーには必須のアイテム。トリガーを設定してテストなどを実行できるソフトウエアです。実行の結果がわかりやすいです
.. [#iiscn] スイッチやロードバランサの設定がいつのまにか変わっていて疎通できない！(・ω・＼)SAN値!(／・ω・)／ピンチ!なんてことがないように


構築にはAnsible
^^^^^^^^^^^^^^^

今回、構築にはAnsible [#iiansible]_ を使ってみます。IIの三層の図の「Configuration」の部分のソフトウエアです。

.. topic:: Configuration界隈の動向

   構築を自動化するために、これまでに色々なツールが出ています。具体的には、Puppet, Chef, Ansible, Salt [#iisalt]_ などがあります。
   それぞれ特徴があり、業務や趣味に向いたものを使いましょう。このへんの比較で本が一冊出来てしまうので、さっくり比較したい場合は InfoWorldの記事 [#iipcas]_ をご覧ください。
   Puppet, Chef, Ansibleの比較記事では Ansible がイイヨ！って記事もあります [#iipca]_ 。
   chefはruby製なので日本で使われるようになったとかなんとか。時期的に新しく出てきたConfigurationツールはPythonを使う傾向にあるようです。Ansible, SaltはPython製です。

.. [#iiansible] http://www.ansible.com/home
.. [#iisalt] http://www.saltstack.com/ 今調べてて知った。「Salt」ってググラビリティー低すぎ...。jujuってのもあんのか...乱立しすぎだろこの界隈
.. [#iipcas] http://www.infoworld.com/d/data-center/review-puppet-vs-chef-vs-ansible-vs-salt-231308?page=0,3
.. [#iipca] http://probably.co.uk/puppet-vs-chef-vs-ansible.html


Ansibleとは
""""""""""""""""""""

Michael DeHaan [#iiansmpd]_ 氏が作ったソフトウエアです [#iiansgithub]_ 。

.. [#iiansmpd] https://github.com/mpdehaan
.. [#iiansgithub] https://github.com/mpdehaan/ansible
.. [#iiansp] https://groups.google.com/forum/#!topic/ansible-project/5__74pUPcuw

AnsibleのWebサイトには、「数時間で自動化できてとってもシンプル！」「構築先のサーバはノンパスsshで入れるようにしておけばOK！」「パワフル」 [#iianpo]_ と書かれています。
Ansibleの仕組みは、1台のControl Machine(CM)から複数のManaged Node(MN)へsshで接続を行います。CMでコマンドを実行すると、MNでCMで指定されたコマンドが実行されます。
インストール対象となるサーバにエージェントを入れる必要はなく、対象のホストにsshでノンパスでログインできるように設定をすればよいです。また、そのユーザでノンパスsudoができるようになっていれば準備完了です。
設定ファイル(Playbookといいます。あとで触れます)はYAMLで作成すればよく、変数の概念はありますが、プログラミングの知識はほぼ必要がありません。

.. [#iianpo] どの辺がパワフルなのか実はよーわからん
.. [#iiansalc] http://eow.alc.co.jp/search?q=ansible&ref=sa

.. Ansibleという言葉をALCのサイトで引いてみると [#iiansalc]_ 「アンシブル◆光の速さより速く、瞬間的にコミュニケーションができるデバイス。ウルシュラ・ル・グインやオースン・スコット・カードのサイエンス・フィクションより。」だそうです。早そうですね(適当)

ここではLinux上でのAnsibleを解説します。Ansible 1.7から、MNとしてWindowsもサポートされたようなので、必要であればドキュメント [#iianwin]_ をご覧ください。CMは現在のところサポートしていないのでご注意。

.. [#iianwin] http://docs.ansible.com/intro_windows.html


Ansibleのインストール
""""""""""""""""""""""

Amazon EC2のAmazon Linux AMI [#iiami]_ では、下記のコマンドでインストール完了。最新版のAnsibleがインストールされます。

.. [#iiami] http://aws.amazon.com/jp/amazon-linux-ami/ amazonが作ったLinux ディストリビューション。CentOSの最新版みたいな感じのディストリビューション [脳内調べ]

.. code-block:: sh

   $ sudo easy_install pip
   $ sudo pip install ansible

CentOS 7 では、こんな感じでした [#iianepel]_ 。

.. [#iianepel] Redhat系で、EPELが入っているなら、 ``sudo yum install ansible`` でインストールできます

.. code-block:: sh

   $ sudo yum install -y gcc python-devel python-paramiko
   $ sudo easy_install pip
   $ sudo pip install ansible

Ansibleは、Python 2.4以上で動作し、Python 2.6以上の環境が推奨されます。Python 2.5以下では、 ``python-simplejson`` パッケージが必要です。CentOS 5などでインストールするときは注意してください。pip [#iipip]_ があるなら、 ``sudo pip install simplejson`` でいけるはずです。今回、Ansible 1.6.6を使いました。
 
.. [#iipip] https://pypi.python.org/pypi/pip Pythonのパッケージのマネージツール。Python版の cpan 的な立ち位置


つかう
""""""""""

Ansibleを実行するサーバ(CM)は、お名前.comのVPS(CentOS 6.5)を、リモートマシン(MN)は DigitalOcean を使って、2つのDroplets [#]_ を作ります。
リモートマシンを作る前に、sshの公開鍵をDigitalOceanに登録しておきましょう。

.. figure:: img/an-do-dl.eps
  :scale: 90%
  :alt: an-do-dl
  :align: center

  nozomiとeriのDroplets

nozomiはUbuntu 14.04 x86、eriはCentOS 6.5 x86を選択しました。nozomiにログインしてみましょう。


.. [#] DigitalOceanでのインスタンスの呼称です。仮想サーバ1つのことを指します

.. topic:: DigitalOceanとは

   1時間1円くらいで使えるVPSです。最小構成では、1CPU(2-3GHz) メモリ512MB SSDのディスク20GB 転送量1GB です。そのプランでは、1時間0.007ドル(約0.7円) [#]_ 、1ヶ月立ち上げっぱなしだと月5ドル(約500円)かかります。検証環境や、静的なコンテンツを配信するサイトであれば十分なスペックです。電源が入っているか入っていないかにかかわらずDropletが存在している時にお金がかかります。Dropletの電源を落としてイメージのスナップショットをとってからDropletを削除すると課金されなくなります。

   リージョンは、ロンドンや、ニューヨークなどがあります。今年2月にシンガポールができました。sshの遅延は気にならないので、私はもっぱらシンガポールリージョンを使っています。

   選択できるOSはUbuntu、Fedora、Debian、CentOSです。この他に、LAMPなどのアプリケーションがインストール済みのイメージもあります。

   Dropletは1分程度で起動します。その間、トイレに行ったり、遠征 [#]_ に出したり、道場 [#]_ を利用したりします。

   .. [#] 2014年8月現在
   .. [#] 艦これのことらしい
   .. [#] モバマスの道場のこと

   Dropletを作成すると、Global IPアドレスが1つ払いだされます。あらかじめダッシュボードからSSHの公開鍵を登録しておくと、rootユーザでsshログインできます。

   ネットの記事をあさったところ、DigitalOceanはデータセンターを借りて自社でサーバを持っているようです。なぜこんなに安いのかは謎です。


.. code-block:: bash
   
   $ ssh root@128.199.134.160
   Welcome to Ubuntu 14.04.1 LTS (GNU/Linux 3.13.0-24-generic x86_64)
   (略)   
   Last login: Sat Aug  2 17:20:58 2014 from xxx.myvps.jp
   root@nozomi:~# 

ログインに成功しました。まずはユーザを作ります。Ubuntuだと ``adduser`` ですね。あとは公開鍵をそのユーザにコピーしてsudoできるようにします [#iiansinstallcom]_ 。

.. code-block:: bash

   # adduser tojo
   # adduser tojo sudo
   # visudo 
   %sudo   ALL=(ALL:ALL) NOPASSWD:ALL # 「NOPASSWORD」を追加
   # cp -a .ssh/ /home/tojo/
   # chown -R tojo. /home/tojo/.ssh

.. [#iiansinstallcom] cpとchownのところ、installコマンドを使って一行で書けないかと試行錯誤したんですが、うまくいきませんでした

今のうちにCMサーバに ``~/.ssh/config`` を作っておきましょう。DigitalOceanのダッシュボードを見ながらこんな感じで作成します。

:: 

   Host nozomi
     Hostname 128.199.134.160
     Port 22
     User tojo
   Host eri
     Hostname 128.199.140.147
     Port 22
     User ayase


CMサーバから ``ssh nozomi`` でログインできることを確認します。 ``sudo ls -la /root/`` の結果が返ってくれば成功です。
ここからは、CMサーバの構築です。プロジェクト用のディレクトリをつくり、設定ファイルを置いていきます。

.. code-block:: sh

   $ mkdir ansible-test ; cd ansible-test

このディレクトリに、hostsというファイルを作ります。MNサーバにsshでログインするときのホスト名を書きます。

:: 

   nozomi
   eri

Ansibeの設定ファイルを書きます。``ansible.cfg`` に下記を設定します。MNサーバが CentOS 6.5 だと、OpenSSHのバージョンが5.3と古く、ControlPersistオプションが処理できないためエラーになります。MNサーバがOpenSSH 5.6以降であればこの設定は不要です。 

:: 

   [ssh_connection]
   ssh_args = 
   

ansibleコマンドを実行してみましょう [#iianssshyes]_ 。

.. [#iianssshyes] sshで初めてのサーバに入ることになるので、yesとか押さないといけないんだけど省略

.. code-block:: bash

   $ ansible all -m ping -i hosts -c ssh
   eri | FAILED => SSH encountered an unknown error during the connection. We 
   nozomi | success >> {
       "changed": false, 
       "ping": "pong"
   }

失敗しましたね。eriサーバはセットアップしていませんでしたね。セットアップしてしまいましょう。 ``ssh root@eri`` でログインしてコマンドを打ちます。今度はCentOSです。

.. code-block:: bash

   [root@eri ~]# useradd -G wheel ayase
   [root@eri ~]# visudo
   %wheel  ALL=(ALL)       NOPASSWD: ALL # コメントになっているので有効化
   [root@eri ~]# cp -a .ssh/ /home/ayase/
   [root@eri ~]# chown -R ayase. /home/ayase/.ssh

ここまでやればCMサーバで ``ssh eri`` でログイン可能になります。再度 ansible コマンドを実行します。デフォルトではsshのクライアントにparamiko [#paramiko]_ を使いますが、 ``~/.ssh/config`` を読んでくれません。 ``-c ssh`` オプションをつけて、OpenSSHを使ってsshの接続を行います。

.. [#paramiko] Python製のSSHv2プロトコルライブラリです https://github.com/paramiko/paramiko

.. code-block:: bash

   $ ansible all -m ping -i hosts -c ssh
   eri | success >> {
       "changed": false, 
       "ping": "pong"
   }
   nozomi | success >> {
       "changed": false, 
       "ping": "pong"
   }

``-i hosts`` は、対象のサーバが書かれたhostsファイルを指定しています。 ``-m ping`` はpingモジュールを使うことを示しています。その他のモジュールについてはあとで説明します。 最後の ``all`` は、hostsファイルの全てのMNサーバを対象にします。今回、pingに対してpongが帰ってきました。成功です。うまくいかない時は、ansibleのコマンドに ``-vvvv`` オプションをつけると、詳細な動作が見えます。

.. topic:: known_hostsを無視する方法

   DigitalOceanの接続先のホストを何度も作りなおしていると、前回使ったGlobal IPアドレスが使いまわされます。
   当然のことながら ``.ssh/known_hosts`` ファイルのキーを消さないとsshのログインに失敗します。そのときは、あらかじめ ``ansible.cfg`` に下記を書いておくと良いです。
   
   .. code-blcok:: ini

      [defaults]
      host_key_checking=False

ここまで読んでいて、勘の良い方はお気づきかもしれません。rootでsshログインできるということは、MNサーバ側で実行したコマンドをAnsibleのPlaybook(後述)にできますね。暇な人はやってみましょう。


アドホックコマンド
""""""""""""""""""

Ansibleの引数に、コマンドを指定することができます。これをアドホックコマンド [#iiansad]_ といいます。早速やってみましょう。OSのディストリビューションを見るコマンドを指定します。

.. [#iiansad] http://docs.ansible.com/intro_adhoc.html

.. code-block:: sh
   
   $ ansible all -a "cat /etc/issue" -i hosts -c ssh
   eri | success | rc=0 >>
   CentOS release 6.5 (Final)
   Kernel \r on an \m
   
   nozomi | success | rc=0 >>
   Ubuntu 14.04.1 LTS \n \l

次に、allではなく、nozomiに対して ``sudo`` しないと実行できないコマンドを送ってみましょう。 ``--sudo`` オプションを付けます。

.. code-block:: sh

   $ ansible nozomi -a "ls -l /root/.ssh" -i hosts -c ssh --sudo 
   nozomi | success | rc=0 >>
   total 4
   -rw-r--r-- 1 root root 401 Aug  2 17:17 authorized_keys

ファイルをコピーしてみます。``copy`` というモジュールがあるので、それを使います。今回はeriに対して実行してみます。

.. code-block:: sh
  
   $ ansible eri -m copy -a "src=/etc/hosts dest=/tmp/hosts" -i hosts -c ssh 
   eri | success >> {
       "changed": true, 
       "dest": "/tmp/hosts", 
       "gid": 500, 
       "group": "ayase", 
       "md5sum": "16be12ab0549a622c8fc02d6b6560afb", 
       "mode": "0664", 
       "owner": "ayase", 
       "size": 244, 
       "src": "/home/ayase/.ansible/tmp/ansible-tmp-1407017000.41-77226202096 
       "state": "file", 
       "uid": 500
   }


``-m`` オプションでモジュールを指定することが出来ます。モジュールの一覧は、``ansible-doc -l`` と表示されます。copyモジュールの詳細を知りたい場合は ``ansible-doc copy`` と打って下さい。アプリケーションをインストールしたい場合は、yumモジュールや、aptモジュールがあります。CentOSの場合、yum経由で apache をインストールするので 

.. code-block:: sh

   $ ansible eri -m yum -a "name=httpd state=latest" --sudo -i hosts -c ssh

と実行します。Ubuntuの場合は 

.. code-block:: sh

   $ ansible nozomi -m apt -a "name=apache2 state=latest" ¥ 
   > --sudo -i hosts -c ssh

でインストールできます。 ``ansible all -m setup`` とすると、OSやIPアドレス、ansibleの変数などの情報が取得できます。
アドホックなコマンドはこのへんにして、Playbookへ話を移しましょう。


Playbook
"""""""""

Playbookとは、MNに対してどのような変更を加えるかを記述したファイルです。中身はYAML [#iiasnayaml]_ です。Chefでいうところのレシピに当たります。
Playbookを作成しましょう。まずは ``playbook.yml`` というファイルに下記のように書きます。

.. [#iiasnayaml] YAMLの書き方はこちらを参照。jsonよりマシ(脳内調べ) http://docs.ansible.com/YAMLSyntax.html

.. code-block:: config

   ---
   - hosts: all
     user: root
     sudo: yes
     tasks:
       - name: yumでphpをインストール
         yum: name=php state=latest
         when: ansible_os_family == 'RedHat'
       - name: aptでphp5をインストール
         apt: name=php5 state=latest
         when: ansible_os_family == 'Debian'

hostファイルに書かれたホスト(今回は全てのホストで行う)に対して、rootユーザで、tasksを実行します。RedHatのシステム(今回CentOS)では、yumモジュールでphpをインストールします。Debian(今回はUbuntu)では、aptモジュールでphp5をインストールしています。
CentOSとUbuntuでパッケージ管理システムに違いがあるため、whenで場合分けしています。ここまで作成したファイルの一覧はこのようになっていると思います。

.. code-block:: sh

   $ ls
   ansible.cfg  hosts  playbook.yml

さてPlaybookを実行してみましょう。

.. code-block:: sh

   $ ansible-playbook playbook.yml -i hosts -c ssh --sudo 

   PLAY [all] ***************************************************************

   GATHERING FACTS **********************************************************
   ok: [eri]
   ok: [nozomi]

   TASK: [yumでphpをインストール] *********************************************
   skipping: [nozomi]
   changed: [eri]

   TASK: [aptでphpをインストール] *********************************************
   skipping: [eri]
   changed: [nozomi]

   PLAY RECAP ***************************************************************
   eri                       : ok=2    changed=1    unreachable=0    failed=0
   nozomi                    : ok=2    changed=1    unreachable=0    failed=0 

インストールできたようです。さて、ある概念を持ち出すためにもう一度、同じコマンドを実行してみましょう。

.. code-block:: sh

   $ ansible-playbook playbook.yml -i hosts -c ssh --sudo 

   PLAY [all] ***************************************************************

   GATHERING FACTS **********************************************************
   ok: [eri]
   ok: [nozomi]

   TASK: [yumでphpをインストール] *********************************************
   skipping: [nozomi]
   ok: [eri]

   TASK: [aptでphpをインストール] *********************************************
   skipping: [eri]
   ok: [nozomi]

   PLAY RECAP ***************************************************************
   eri                       : ok=2    changed=0    unreachable=0    failed=0   
   nozomi                    : ok=2    changed=0    unreachable=0    failed=0   

わざとこんなことをやっているのには理由があります。IIではおなじみの冪等性(べきとうせい)です。

.. topic:: 冪等性

   何度やっても同じ結果になるという意味の言葉です。中途半端に構築したサーバでも、新規のサーバでも、同じPlaybook(Chefの場合はRecipe)を実行すれば、同じ状態になります。
   AnsibleやChefにあるモジュールは冪等性を担保しているので、何度実行してもサーバが同じ状態になります。それ以外の自分で書いたスクリプトは、自分で冪等性を担保しなければなりません(これがつらさを生み出す原因になることがあります)。

   構成管理における冪等性の利点はAnsibleやChefなどの構成管理ツールでコード化できる点です。できあがったサーバは、Serverspecやinfratasterを使ってテストを行い、動作の保証を行います。

   デプロイされているプログラムのアップデートにともなって、ミドルウエアのモジュールを追加したい場合があります。手順書をコード化してサーバで実行すれば、構築完了です。
   ただし、本番環境に対して変更を加える事はストレスになります。一方、本記事の冒頭にでてきた「作って壊す」という環境があれば、冪等性について考える必要はないかもしれません。
   そんな時はBlue-Green Deploymentで切り替えましょう。といっても、そんな富豪的に使えるところってあるんですかねえ・・・


過去の遺産 Playback
""""""""""""""""""

すでに手持ちのシェルスクリプトがある方は、 ``hoge.sh`` というファイル名でPlaybookと同じディレクトリにおいてください。そして、Playbookにはこのように書きます。

.. code-block:: sh

   ---
   - hosts: all
     user: root
     tasks:
       - name: シェルスクリプトを実行
         script: hoge.sh

なお、このスクリプトは自分で冪等性を保証してください。もし環境を壊してしまったら、環境を一回壊して作りなおしてから再挑戦です。


実践する
""""""""

AnsibleのPlaybookのサンプルが公開されています [#iiansexam]_ 。この中にある ``lamp-simple`` を実際に使ってみましょう。

.. [#iiansexam] https://github.com/ansible/ansible-examples

まずはCMサーバの適当なディレクトリで ``git clone https://github.com/ansible/ansible-examples.git`` して持ってきます。
webserverとdbserverに役割が分かれています。DigitalOceanで、honokaとkotoriのDropletsを作成します [#iianshon]_ 。

.. [#iiansreadme] https://github.com/ansible/ansible-examples/blob/master/lamp_simple/README.md
.. [#iianshon] honokaはさっき作ったものをそのまま利用。やっぱりDropletsって言葉が（ｒｙ

.. figure:: img/an-do-honokoto.eps
  :scale: 90%
  :alt: an-do-honokoto
  :align: center

  honokaとkotoriのDroplets

~/.ssh/configと、ansible.cfgに設定を適切に設定します。hostsファイルを以下のように書き換えます。

:: 

   [webservers]
   honoka 
   
   [dbservers]
   kotori 

あとはansibleを実行するだけです。

.. code-block:: sh

   $ ansible-playbook -i hosts site.yml -c ssh

数分待てば、honokaにapacheが、dbserverにmysqlがそれぞれ立ち上がっていてhonokaにブラウザでアクセスするとDBの中身が読めた旨のメッセージがでてきます。

.. figure:: img/an-do-ans-lamp.eps
  :scale: 50%
  :alt: an-do-ans-lamp
  :align: center

  honokaサーバにアクセスすると、セットアップできてることが確認できる

さいごに
""""""""

さらに様々なPlaybookを探すには、Ansible Galaxy [#iiansag]_ を参照して下さい。
業務などできっちりやるなら、ベストプラクティスとしてディレクトリのレイアウト(http://docs.ansible.com/playbooks_best_practices.html)があります。どのサーバにどの変数を使うか、実験環境と本番環境を分けたりそういったことができます。また、「ansible ベストプラクティス」と検索するといくつかでてきます。

.. [#iiansag] https://galaxy.ansible.com/explore#/

参考
""""

8月に「入門Ansible」(http://www.amazon.co.jp/dp/B00MALTGDY/)がKindleで出版されました。この本を読めばAnsibleを使いこなせるようになります。オススメです。

* An example of provisioning and deployment with Ansible Conceived on 22 May 2013 : http://www.stavros.io/posts/example-provisioning-and-deployment-ansible/
* 不思議の国のAnsible – 第1話 : http://demand-side-science.jp/blog/2014/ansible-in-wonderland-01/
* 今日からすぐに使えるデプロイ・システム管理ツール ansible 入門 : http://tdoc.info/blog/2013/05/10/ansible_for_beginners.html
* 入門Ansibleを出版しました : http://tdoc.info/blog/2014/08/01/ansible_book.html


仮想化・その1 Vagrant編
^^^^^^^^^^^^^^^^^^^^^^

仮想化のツールとして、HashiCorp [#iihashi]_ が提供しているVagrant [#iiveg]_ を取り上げます。Vagrantとは、ホストOS上に独立した仮想マシンを立ち上げることができるツールです。
Vagrantの仮想マシンは、Boxというファイルに保存することができます。
Vagrantがインストールされているマシンに、Boxファイルを読み込ませれば、保存されたマシンが起動します。仮想マシンを気軽に作ったり壊したりできます。

Vagrantはruby [#iivaggh]_ で書かれています。ホストOSとして使えるOSは、Max OS X、主要なLinuxのディストリビューション、Windowsです。設定ファイルは、Vagrantfileというファイルに記述します。
仮想マシンは、デフォルトではVirtualBox上で起動します。それ以外にも、VMwareやAWS、DigitalOceanにも仮想マシンを立てることができます。仮想マシンを立てられるプラットフォームをプロバイダーと呼びます。

.. [#iihashi] http://www.hashicorp.com/
.. [#iiveg] http://www.vagrantup.com/
.. [#iivaggh] https://github.com/mitchellh/vagrant


インストール
""""""""""""

まずは、Vagrant + VirtualBox の組み合わせを試します。

* Max OS X へインストール

Vagrant [#iivagmacin]_ , VirtualBox [#iivagvbin]_ とも、公式サイトでMac OS X用のインストーラが用意されています。

.. [#iivagmacin] http://www.vagrantup.com/downloads.html インストーラはここからダウンロード
.. [#iivagvbin] https://www.virtualbox.org/wiki/Downloads インストーラはここからダウンロード

.. figure:: img/vagrant-mac.eps
  :scale: 50%
  :alt: vagrant-mac
  :align: center

  Vagrantのインストーラ

.. figure:: img/virtualbox-mac.eps
  :scale: 50%
  :alt: virtualbox-mac
  :align: center

  VirtualBoxのインストーラ

* CentOS 6.5にインストール

Vagrant は RPM でリリースされています。ホストOSのカーネルバージョンに依存します。起動しているカーネルと同じバージョンの ``kernel-devel`` ``kernerl-headers`` がインストールされていないとVirtualBoxが起動しません。もしなければ、RPMを探してインストールしましょう [#iivagker]_ 。

.. [#iivagker] DigitalOceanのDropletsでやってみたところ、起動しているカーネルとインストールされているkernel-develなどのバージョンが違い、ハマる

kernelに依存するので、カーネルが変わってもモジュールを再コンパイルしてくれる ``dkms`` [#dkms]_ も合わせてインストールしておきます [#iivagperl]_ 。
VirtualBoxのRPMのファイルサイズが大きいので、一旦wgetしてから ``yum install`` に噛ませます [#iivagdl]_  。

.. [#dkms] Dynamic Kernel Module Support - http://linux.dell.com/dkms/
.. [#iivagperl] perlが入っていないとインストール出来ないので注意。DigitalOceanのCentOS6.5でハマるなど
.. [#iivagdl] VPS上でのwgetが遅ければ、一旦ローカルにダウンロードしてきてDropboxか何かでファイル共有するのが早い

.. code-block:: sh

   [root@rin ~]# rpm -ivh vagrant_1.6.3_x86_64.rpm 
   Preparing...            ########################################### [100%]
      1:vagrant            ########################################### [100%]
   [root@rin ~]# rpm -ivh http://pkgs.repoforge.org/rpmforge-release/¥
               > rpmforge-release-0.5.3-1.el6.rf.x86_64.rpm
   [root@rin ~]# yum install dkms
   [root@rin ~]# wget http://download.virtualbox.org/virtualbox/4.3.14/¥
               > VirtualBox-4.3-4.3.14_95030_el6-1.x86_64.rpm
   [root@rin ~]# yum install http://download.virtualbox.org/virtualbox/¥
               > 4.3.14/VirtualBox-4.3-4.3.14_95030_el6-1.x86_64.rpm
   [root@rin ~]# /etc/init.d/vboxdrv setup


vagrant upして仮想マシンを起動
"""""""""""""""""""""""""""""

仮想マシンを起動してみましょう。ここでは、CentOS 6.5 をホストOSとして仮想マシンを起動して、その仮想マシンにsshでログインするまでのコマンドです。

.. code-block:: sh

   [hoshizora@rin ~]# cd ; mkdir vmachine ; cd vmachine
   [hoshizora@rin ~]$ vagrant init hashicorp/precise32
   A `Vagrantfile` has been placed in this directory. You are now
   ready to `vagrant up` your first virtual environment! Please read
   the comments in the Vagrantfile as well as documentation on
   `vagrantup.com` for more information on using Vagrant.
   [hoshizora@rin ~]# vagrant up
   [hoshizora@rin ~]# vagrant ssh

一行目で、Vagrantを起動するためのファイル(Vagrantfile)を置くため、適当なディレクトリを作っています。
次の行で、作成するBox名(hashicrop/precise32)を指定します。これが終わるとVagrantfileが作られています。コメントを外した中身はたった4行です。

:: 

   VAGRANTFILE_API_VERSION = "2"
   Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
     config.vm.box = "hashicorp/precise32"
   end

これだけで仮想マシンの準備ができました。

``vagrant up`` を実行すると、vagrantcloud.comからboxのダウンロードが始まります。vagrantcloud.comには様々なOS, アプリケーションがインストール済みのBoxファイルがあるので、目的に合わせたものを選択して使うことができます。

コマンドの実行に若干時間がかかりますが、これらのコマンドでUbuntu 12.04 LTSの仮想マシンがVirtualBox上で立ち上がります。 ``vagrant ssh`` で、その仮想マシンにsshでログインできます。
ホストOSの下記のディレクトリに、VirtualBoxのvmdkなどのファイルがおいてあります。

.. code-block:: sh

   $ ll ~/.vagrant.d/boxes/hashicorp-VAGRANTSLASH-precise32/1.0.0/virtualbox/
   total 288344
   -rw------- 1 hoshizora hoshizora 295237632 Aug  1 04:32 box-disk1.vmdk
   -rw------- 1 hoshizora hoshizora     14103 Aug  1 04:32 box.ovf
   -rw-rw-r-- 1 hoshizora hoshizora        25 Aug  1 04:32 metadata.json
   -rw-r--r-- 1 hoshizora hoshizora       505 Aug  1 04:32 Vagrantfile


* vagrant command

ここで、vagrantのコマンドを見ていきます。vagrantコマンドを単体で打つとヘルプが表示されます。仮想マシンの状態を見るコマンドは ``vagrant status`` です。

.. code-block:: sh
   
   $ vagrant status
   Current machine states:
   
   default                   running (virtualbox)


``vagrant box list`` で仮想マシンのBoxのリストが表示されます。 ``vagrant halt`` で仮想マシンの電源を切ります。 ``vagrant suspend`` というコマンドもあり、その名の通り仮想マシンがsuspend状態になります。destroyすると仮想マシンが削除されます。これらのコマンドは、Vagrantfileがあるディレクトリで実行しないと怒られます。激おこです。

.. code-block:: sh

   $ vagrant box list
   hashicorp/precise32 (virtualbox, 1.0.0)

   $ vagrant halt
   ==> default: Attempting graceful shutdown of VM...

   $ vagrant destroy
       default: Are you sure you want to destroy the 'default' VM? [y/N] y


* Vagrantfile

Vagrantfileを編集してみましょう。ホストOSとディレクトリの共有の設定をしてみます。ホストファイルの /hoge ディレクトリ(絶対パスでかけばどこでも良い)を、仮想マシンの /tmp にマウントしてみます。
仮想マシンに適当なディレクトリを作っておくのがセオリーです。今さっきdestroyしてしまったので、ありもののディレクトリにマウントします。
Vagrantfileを下記のように編集します。

:: 

   config.vm.box = "hashicorp/precise32"
   config.vm.synced_folder "/hoge", "/var/tmp" # この行を追記

``vagrant up`` して、 ``vagrant ssh`` するとマウントされていることが確認できます。今回は問題ないのですが、次回以降、Vagrantfileを書き換えたら、 ``vagrant reload`` すると仮想マシンに変更が適用されます。ただし、再起動するのでご注意。次の準備があるので、ここで仮想マシンをdestroyしておきましょう。


* provisioning

サーバの基本的な設定やソフトウエアのインストールを自動化することができます。これを提供するのがプロビジョニングという機能です。
手元に用意したシェルスクリプト(script.sh)を、仮想のマシンに実行してみます。
Vagrantfileと同じディレクトリにscript.shを用意します。 ``date`` の内容をファイルに書き出す簡単なものです。

:: 

   #!/bin/sh
   date > /tmp/nya


先ほどのVagrantfileを編集します。inlineでコマンドを直接書くことも出来ます。また、pathにファイルを渡すと実行してくれます。

:: 

   config.vm.box = "hashicorp/precise32"
   config.vm.provision "shell", inline: "echo hello" # この行を追加
   config.vm.provision "shell", path: "script.sh" #この行も追加

プロビジョニングを実行します。

.. code-block:: sh

   $ vagrant provision
   ==> default: Running provisioner: shell...
       default: Running: inline script
   ==> default: stdin: is not a tty
   ==> default: hello
   ==> default: Running provisioner: shell...
       default: Running: /tmp/vagrant-shell20140802-28134-1xoahlm.sh
   ==> default: stdin: is not a tty

``vagrant ssh`` すると、 /tmp/nya ファイルができています。プロビジョニングが実行されるタイミングについては、Vagrantのドキュメント [#iivagpro]_ を参照して下さい。

.. [#iivagpro] https://docs.vagrantup.com/v2/provisioning/index.html

* provisoning - ansible編

プロビジョニングの例では、コマンド呼び出しやシェルスクリプトの実行を行いました。その他に、ChefやPuppet、Ansibleも呼び出すことができます。
Ansibleに触れたところなので、今回はプロビジョニングにAnsibleを使ってみます。仮想マシンは2台立ち上げて、ホストOSのVagrantfileからAnsibleを実行してみます。

Vagrantfileの設定です。下記のようにします。

:: 

   VAGRANTFILE_API_VERSION = "2"
   
   Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
     config.vm.define :honoka do |node|
       node.vm.box = "hashicorp/precise32"
       node.vm.network :forwarded_port, guest: 22, host: 2001, id: "ssh"
       node.vm.network :private_network, ip: "192.168.56.101"
       config.vm.provision "ansible" do |ansible|
         ansible.playbook = "playbook.yml"
         ansible.extra_vars = { ansible_ssh_user: 'vagrant' }
         ansible.sudo = true
       end
     end
     
     config.vm.define :rin do |node|
       node.vm.box = "hashicorp/precise32"
       node.vm.network :forwarded_port, guest: 22, host: 2002, id: "ssh"
       node.vm.network :forwarded_port, guest: 80, host: 8000, id: "http"
       node.vm.network :private_network, ip: "192.168.56.102"
     end
   end

config.vm.defineが2回登場します。仮想マシンを2つ起動する設定です。それぞれの仮想マシンに設定を行います。各オプションの簡単な解説です。

forwarded_port
  仮想マシンのポートをホストOSのどのポートに割り当てるかを指定します

private_network
  VirtualBox上の仮想マシンのプライベートネットワークとIPアドレスを設定します。実は今回のプロビジョニングでは使用しません。仮想マシンから他の仮想マシンへのアクセスの必要があるときに使います。もちろん、ホストOSからこのIPアドレスにアクセスすることができます

ansible.playbook
  ansibleで実行するPlaybookのファイル名を指定します。playbook.ymlはカレントディレクトリに配置します

ansible.extra_vars
  sshのログインアカウントはデフォルトvagrantが作られているため、そのユーザ名を利用します

ansible.sudo
  ansibleコマンドに ``--sudo`` が付きます


hosts ファイルに、仮想マシンのホスト名を書きます。

::
   
   # hosts
   [otonoki]
   honoka ansible_connection=ssh 
   rin ansible_connection=ssh 

CentOS 6系では、``~/.ssh/config`` を読んでくれない問題の回避をするため、ansible.cfgに下記を書きます。

::
   
   # ansible.cfg
   [ssh_connection]
   ssh_args = 

最後にPlaybookです。apacheのインストールと、HTTPでアクセスしたときに表示するテキストを作っておきましょう。

.. code-block:: sh

   echo "雨やめー！！" > honoka


:: 

   ---
   - hosts: all
     tasks:
     - name: ensure apache is at the latest version
       apt: pkg=apache2 state=latest
     - name: ensure apache is running
       service: name=apache2 state=started
     - name: copy test file
       copy: src=honoka dest=/var/www


``vagrant up`` で仮想マシンを起動します。無事に仮想マシンが立ち上がり、apacheがインストールされたでしょうか。
初回起動時に、provisionの設定があると自動的にprovisionを実行します。playbook.ymlなどを変更してプロビジョニングをやり直したいときは、 ``vagrant provision`` を実行して下さい。
なお、上記の設定だと、rinの仮想マシンでもplaybook.ymlが適用されてしまいます。各自直してみてください。


* vagrant share

Vagrantには、作った仮想マシンをネット上に公開する機能があります。VAGRANT CLOUDのサイトからアカウントを登録して、コマンドラインから公開したい仮想マシンを ``vagrant share`` すると公開されます。

まずは、VAGRAT CLOUD(https://vagrantcloud.com/)にアカウントを登録します。「JOIN VAGRANT CLOUD」というリンクがあるので、そこからメールアドレスとパスワードを登録します。

.. figure:: img/vagrantc.eps
  :scale: 90%
  :alt: vagrantc
  :align: center

  Vagrant Cloudの画面(https://vagrantcloud.com/)

登録が終わったら、コマンドラインに戻ります。登録時に入力したログインアカウントを入力します。

.. code-block:: sh

   $ vagrant login
   In a moment we'll ask for your username and password to Vagrant Cloud.
   After authenticating, we will store an access token locally. Your
   login details will be transmitted over a secure connection, and are
   never stored on disk locally.
   
   If you don't have a Vagrant Cloud account, sign up at vagrantcloud.com
   
   Username or Email: user@example.com
   Password (will be hidden): 
   You're now logged in!

公開してみます。

.. code-block:: sh

   $ vagrant status
   Current machine states:
   
   honoka                    running (virtualbox)
   rin                       running (virtualbox)

   $ vagrant share honoka
   ==> honoka: Detecting network information for machine...
       honoka: Local machine address: 192.168.56.101
       honoka: Local HTTP port: 80
       honoka: Local HTTPS port: disabled
   ==> honoka: Checking authentication and authorization...
   ==> honoka: Creating Vagrant Share session...
       honoka: Share will be at: dynamite-antelope-8007
   ==> honoka: Your Vagrant Share is running! Name: dynamite-antelope-8007
   ==> honoka: URL: http://dynamite-antelope-8007.vagrantshare.com


この状態で放置します。別の端末からcurlコマンドを実行して、応答が返ってくることを確認します。もちろんブラウザからURLを入力しても構いません。

.. code-block:: sh

   curl http://dynamite-antelope-8007.vagrantshare.com/honoka
   雨やめー！！

VAGRANT CLOUDのサイトからも共有されていることが確認できます。

.. figure:: img/vagrant-share.eps
  :scale: 90%
  :alt: vagrant-share
  :align: center

  Vagrant Cloudの画面(https://vagrantcloud.com/shares)

share中の状態では、仮想マシンをVAGRNT CLOUD上にアップロードしているわけではなく、プロキシされています [#ngrok]_ 。その証拠に、ApacheのアクセスログにNATされたIPアドレスが残ります。
shareを終了するには、``vagrant share honoka`` のコマンドを実行したところでCtrl+cを打ち込みます。
設定次第で、SSHでも仮想マシンにアクセスすることができます。セキュリティには注意して下さい。

.. [#ngrok] 外部からローカルホストにトンネルつくって、インターネットからアクセスできるツールにngrok(https://ngrok.com/)があります


* DigitalOceanプラグイン

プロバイダーとしてDigitalOceanが選択できます。内部では、DigitalOceanのAPI(v2)を叩いています。
ここでは、ホストOSに引き続きCentOS 6.5を使っていきます。
まずはDigitalOceanでClient IDとAPI Keyを取得します。このページのURL(https://cloud.digitalocean.com/api_access)へのリンクは見つけにくいので、URLを直にたたいた方が早いです。

.. figure:: img/do-api-key.eps
  :scale: 70%
  :alt: do-api-key
  :align: center

  Client_idとAPI Keyを生成(https://cloud.digitalocean.com/api_access)

token を取得します。tokenを作るときに、Write権限の設定にチェックを入れて下さい。Dropletが作れずDigitalOceanのAPIがエラーを返します。

.. figure:: img/do-gen-token.eps
  :scale: 90%
  :alt: do-gen-token
  :align: center

  tokenを取得します(https://cloud.digitalocean.com/settings/applications)

.. figure:: img/do-gen-token2.eps
  :scale: 90%
  :alt: do-gen-token2
  :align: center

  tokenの管理上の名前を入力。そして、Writeにチェックを入れましょう

DigitalOceanにSSH Keysの名前を登録していない場合はホストOSの公開鍵を登録します。登録した鍵の名前が必要です。ここではpublickeyとしています。
ここまでできたら、適当なディレクトリにVafrantfileを作りましょう。取得したClient IDとAPI KEY、tokenを入力します。メモリ512MBの最小インスタンスで、Ubuntu 14.04 x64のイメージを使ってシンガポールリージョン(sgp1)にDropletを作成します。

:: 

   VAGRANTFILE_API_VERSION = "2"
   Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
     config.vm.hostname              = 'umi'
     config.vm.provider :digital_ocean do |provider, override|
       override.ssh.private_key_path = '~/.ssh/id_rsa'
       override.vm.box               = 'digital_ocean'
       override.vm.box_url="https://github.com/smdahlen/vagrant-digitalocean/
       raw/master/box/digital_ocean.box"
       provider.client_id            = 'Client IDを入力'
       provider.api_key              = 'API KEYを入力'
       provider.token                = 'tokenを入力'
       provider.image                = 'Ubuntu 14.04 x64'
       provider.region               = 'sgp1'
       provider.size                 = '512mb'
       provider.ssh_key_name         = 'publickey' # 公開鍵の名前
     end
     config.vm.provision "ansible" do |ansible|
       ansible.playbook = "playbook.yml"
       ansible.sudo = true
     end
   end


ホストOSとなるマシンに、vagrant-digitalocean プラグインをインストールします [#iivagdoa]_ 。MacをホストOSにする場合は、DigitalOceanのAPIを叩く都合上、 ``brew install curl-ca-bundle`` でCA bundleのインストールを行って下さい。

.. [#iivagdoa] https://github.com/smdahlen/vagrant-digitalocean 私が確認した時は、README.mdのConfigureの設定が足りませんでした

.. code-block:: sh

   $ vagrant plugin install vagrant-digitalocean

playbook.ymlの内容は、apacheをインストールして、起動、ホストOSにあるファイルを仮想マシンのドキュメントルートに配置します。

:: 

   ---
   - hosts: all
     tasks:
     - name: ensure apache is at the latest version
       apt: pkg=apache2 state=latest
     - name: ensure apache is running
       service: name=apache2 state=started
     - name: copy test file
       copy: src=umi dest=/var/www/html

ドキュメントルートに置くファイルをバーンと作成。

.. code-block:: sh

   echo "みんなのハート打ち抜くゾ！　バーン！" > umi

仮想マシンを立ち上げます。今回は、DigitalOceanのAPIにアクセスしてDropletを作っています。

.. code-block:: sh

   $ vagrant up --provider=digital_ocean
   Bringing machine 'default' up with 'digital_ocean' provider...
   ==> default: Using existing SSH key: yoshihama4
   ==> default: Creating a new droplet...
   
   ==> default: Assigned IP address: 128.199.134.160
   ==> default: Rsyncing folder: /home/tboffice/precise32/ => /vagrant...
   ==> default: Running provisioner: ansible...
   (略)

   $ curl 128.199.134.160/umi
   みんなのハート打ち抜くゾ！　バーン！

無事に撃ちぬかれましたね。間違えた。起動しましたね。Playbookを変更したら、 ``vagrant provision`` で反映できます。使い終わったら、 ``vagrant destroy`` でDropletを削除しましょう。


* 参考

  * 仮想環境構築ツール「Vagrant」で開発環境を仮想マシン上に自動作成する : http://knowledge.sakura.ad.jp/tech/1552/
  * Windows7にVirtualBoxとVagrantをインストールしたメモ : http://k-holy.hatenablog.com/entry/2013/08/30/192243 
  * 1円クラウド・ホスティングDigitalOceanを、Vagrantから使ってみる : http://d.hatena.ne.jp/m-hiyama/20140301/1393669079
  * VagrantとSSDなVPS(Digital Ocean)で1時間1円の使い捨て高速サーバ環境を構築する : http://blog.glidenote.com/blog/2013/12/05/digital-ocean-with-vagrant/
  * Vagrant ShareでVagrant環境をインターネット上へ公開する : http://qiita.com/y-mori/items/1f70e7c9d8771f0d939a
  * Vagrant超入門：Vagrant初心者向けの解説だよ！ : https://github.com/tmknom/study-vagrant
  * smdahlen/vagrant-digitalocean : https://github.com/smdahlen/vagrant-digitalocean


仮想化・その2 docker
^^^^^^^^^^^^^^^^^^^

.. figure:: img/docker-logo.eps
  :scale: 70%
  :alt: docker-logo
  :align: center

  Dockerのロゴ

Dockerとは、たいそう面白いギャグを連発して観客を "どっかーどっかー" 沸かすツールです。そういう冗談はおいといて、Dockerのgithubによると「Docker: the Linux container engine」とあります。
DockerはホストOSのカーネルを共有し、AUFSというファイルシステムを使って仮想化を実現しています。
あらかじめインターネット上に用意されているDockerのイメージを元に、コンテナと呼ばれる仮想マシンを起動します。1つのコンテナには、1つのプロセスを起動するのが基本的な使い方です。


インストール
""""""""""""

おや、こんなことろ(DigitalOcean)にDocker入りのイメージがあるじゃないですか。バージョンは1.1.1です。hanayoという名前でDropletを作りました。Dropletが立ち上がれば完了です。ね、簡単でしょ？

.. figure:: img/dk-do-image.eps
  :scale: 70%
  :alt: dk-do-image
  :align: center

  DigitalOceanのImageにDockerがすでにあります

ホストOSは、Ubuntu 14.04 で、最小スペックを使います。

俺はッ！！本気で！！！！インストールしたいッヒョオッホーーー！！ウーハッフッハーン！！　ッウーン！ [#iidocun]_ な方は、インストールのドキュメントをご覧ください [#iidocins]_ 。CentOS [#iidoccentos]_ やAmazon EC2などにインストールすることができます。バイナリリリース [#iidocbin]_ もあります。

.. [#iidocun] お察し下さい
.. [#iidocins] https://docs.docker.com/installation/#installation
.. [#iidoccentos] CentOS 6以上でカーネル2.6.32-431以上を使ってねってと書いてあります。しかし、カーネルは3系のCentOS7にしておいたほうが良いという先人の言い伝えがあります
.. [#iidocbin] http://docs.docker.com/installation/binaries/


つかってみる
""""""""""""

先ほど起動したDroletにrootでログインして、 ``docker`` コマンドをたたいてみます。

.. code-block:: sh

   # ssh root@128.199.140.147
   root@hanayo:~# docker
   Usage: docker [OPTIONS] COMMAND [arg...]
    -H=[unix:///var/run/docker.sock]: tcp://host:port to bind/connect to or 
    unix://path/to/socket to use
   
   A self-sufficient runtime for linux containers.
   
   Commands:
       attach    Attach to a running container
       build     Build an image from a Dockerfile
       commit    Create a new image from a container's changes
   (略)

``docker command`` でcommandのヘルプを表示します。オプションを探すときに使います。早速、簡単なアプリケーションを起動してみます。

.. code-block:: sh

   # docker run ubuntu:14.04 /bin/echo 'Hello world'
   Unable to find image 'ubuntu:14.04' locally
   Pulling repository ubuntu
   e54ca5efa2e9: Download complete 
   511136ea3c5a: Download complete 
   d7ac5e4f1812: Download complete 
   2f4b4d6a4a06: Download complete 
   83ff768040a0: Download complete 
   6c37f792ddac: Download complete 
   Hello world

ubuntu:14.04というイメージを指定しています。そのイメージからコンテナを立ち上げ、そのコンテナで ``/bin/echo 'Hello world'`` を実行しています。
初回は、数分かかります。上記の標準出力結果には残りませんが、ダウンロードが実行されます。これについてはあとで触れます。
Hollo worldが表示されたら、コンテナに入ってみましょう。 ``docker run`` でコンテナに対してコマンドを打ちます。

.. code-block:: sh

   root@hanayo:~# docker run -t -i ubuntu:14.04 /bin/bash
   root@37b8238dbcdd:/# 
   root@37b8238dbcdd:/# exit
   root@hanayo:~# 

ubuntu:14.04というイメージで ``/bin/bash`` を実行してシェルを掴んできました。そして ``exit`` してホストOSへ戻ってきました。

コンテナ内でディスク、メモリの情報を探すと、hanayoで実行したときと同じ結果が返ってきます。
ifconfigを打つと、ローカルIPがふられています。ホストOSからのアクセス方法については、後ほど。次に、コマンドをデーモン化( ``-d`` オプション)して実行してみましょう。

.. code-block:: sh

   # docker run -d ubuntu:14.04 ping www.lovelive-anime.jp
   d7168d2c3b421192a49dc15927b6a1466ab73424bda94e11679af9f8509f369c
   # docker ps 
   CONTAINER ID IMAGE        COMMAND CREATED        STATUS        NAMES
   d7168d2c3b42 ubuntu:14.04 ping ww 18 seconds ago Up 18 seconds happy_meitner    
   
   # docker logs happy_meitner  | head
   PING www.lovelive-anime.jp (210.138.156.25) 56(84) bytes of data.
   64 bytes from 25.156.138.210.rev.iijgio.jp (210.138.156.25): icmp_seq=1 tt
   64 bytes from 25.156.138.210.rev.iijgio.jp (210.138.156.25): icmp_seq=2 tt
   64 bytes from 25.156.138.210.rev.iijgio.jp (210.138.156.25): icmp_seq=3 tt

コマンドの標準出力の内容が全て出てきます。もう一回、同じコマンドをたたいても最初から標準出力の内容がでてきます。プロセスを止めます。コンテナ名の指定には ``docker ps`` をしたときの、NAMESか、あるいはCONTAINER IDを指定します。ここでは、NAMESの値を指定します。

.. code-block:: sh

   # sudo docker stop happy_meitner 
   happy_meitner

タスクの名前は、命名規則は「形容詞_人の名前」になってるみたいです。ここまで、dockerのコンテナの立ち上げと削除を行いました。別のOSも使ってみましょう。

.. code-block:: sh

   # docker pull centos
   Pulling repository centos
   cd934e0010d5: Download complete 
   1a7dc42f78ba: Download complete 
   511136ea3c5a: Download complete 
   34e94e67e63a: Download complete 
   root@hanayo:~#

おもむろにCentOSが持ってこれましたね。初回だけイメージを引っ張ってくるので時間がかかります。2度目以降はすぐにコンテナが起動します。今日も一日がんばるぞい！それでは、ログインしてみましょう。

.. code-block:: sh

   root@hanayo:~# docker run -t -i centos /bin/bash
   bash-4.2# cat /etc/redhat-release 
   CentOS Linux release 7.0.1406 (Core) 
   bash-4.2# 

CentOS 7ですね。hanayoのサーバはUbuntuなのに、Docker上のイメージでCentOSが動作しています。ここで、おもむろにカーネルのバージョンを見てみましょう。

.. code-block:: sh

   bash-4.2# uname -a 
   Linux 4ee22d17ac9a 3.13.0-24-generic #46-Ubuntu SMP Thu Apr 10 19:11:08 UT

CentOSなのに、Ubuntuって書いてありますね。ログアウトしてカーネルを見てみます。

.. code-block:: sh

   bash-4.2# exit
   root@hanayo:~# uname -a 
   Linux hanayo 3.13.0-24-generic #46-Ubuntu SMP Thu Apr 10 19:11:08 UTC 2014

hanayoとカーネルが一致しますね。Dockerはカーネルだけを共有しています [#iidocker]_ 。公式サイトから図を引用してみます。VMとの違いがなんとなく分かってきます。

.. [#iidocker] http://stackoverflow.com/questions/18786209/what-is-the-relationship-between-the-docker-host-os-and-the-container-base-image

.. figure:: img/dk-con.eps
  :scale: 100%
  :alt: dk-con.eps
  :align: center

  https://www.docker.com/whatisdocker/より引用。VMとDockerの違い

そういえば、このCentOSは、どこから持ってきたんでしょうか。答えは、docker hubに登録されているイメージファイルをもってきています。

.. figure:: img/dk-hub-centos.eps
  :scale: 90%
  :alt: dk-hub-centos
  :align: center

  https://registry.hub.docker.com/_/centos/

Dockerのイメージファイルは https://hub.docker.com/ にあります。searchコマンドでも探すことが出来ます。たくさんあります [#iidocsb]_ 。

.. code-block:: sh

   # docker search centos | head
   NAME                         DESCRIPTION                                    
   centos                       The official build of CentOS.                     
   tianon/centos                CentOS 5 and 6, created using rinse instea...  
   blalor/centos                Bare-bones base CentOS 6.5 image               
   saltstack/centos-6-minimal                                                  
   stackbrew/centos             The CentOS Linux distribution is a stable,...         

.. [#iidocsb] stackbrew(https://github.com/dotcloud/stackbrew)というのが公式イメージの一つです。 ``NAME`` は、 ``username/imagename`` と付けるのが流儀。

再度、実行してみましょう。ついでに ``gcc`` をインストールをインストールしてみましょう。CentOSなので、もれなく ``yum install -y gcc`` が打てます。応募者全員サービスです。

.. code-block:: sh

   root@hanayo:~# docker run -t -i centos /bin/bash
   bash-4.2# yum install -y gcc
   (略)
   Complete!
   bash-4.2# ps aux
   USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
   root         1  0.0  0.3  11740  1692 ?        Ss   17:54   0:00 /bin/bash
   root        61  0.0  0.2  19748  1200 ?        R+   17:58   0:00 ps aux
   bash-4.2# exit
   root@hanayo:~# 

なんとなく ``ps`` コマンドを打ってみました。

.. topic:: おわかりいただけただろうか。

   なんと ``ps`` コマンドを打つと、bashのプロセスと自身の ps プロセスしかいないのだ。プロセスのおかわりはいただけないのだろうか。いただけないのである。
   何故、こんなことを書いているかというと、コンテナには1つのプロセスしか起動しないのが基本的な使い方だからである。topを打つともちろん、bashとtopのプロセスしかないのだ！！！な、なんだって！！ ``ΩΩ Ω``

いったんbashを抜けて、コンテナをすべて表示してみます。centos:centos7というイメージを使って、2つのコンテナがあることが分かります。

.. code-block:: sh

   root@hanayo:~# docker ps -a
   CONTAINER ID IMAGE          COMMAND   CREATED        (STATUSに続く)
   0ab61f52d310 centos:centos7 /bin/bash 8 minutes ago  (Exitedに続く)
   31318abf2f23 centos:centos7 /bin/bash 11 minutes ago (Exitedに続く)

   STATUS                     PORTS NAMES
   Exited (130) 4 seconds ago       furious_mayer    
   Exited (130) 9 minutes ago       prickly_bardeen  


STATUSがExitedとなっていますね。bashプロセスから抜けると、コンテナは起動をやめてしまうのです。では、このコンテナを起動させてみましょう。
その前に、便利な ``dl`` コマンドを作りましょう [#iidocdl]_ 。一番直近に作られたコンテナの名前を返してくれるコマンドです。

.. [#iidocdl] 15 Docker Tips in 5 Minutes - http://sssslide.com/speakerdeck.com/bmorearty/15-docker-tips-in-5-minutes

.. code-block:: sh

   root@hanayo:~# alias dl='docker ps -l -q'
   root@hanayo:~# dl
   0ab61f52d310

実行できましたね。

.. code-block:: sh

   root@hanayo:~# docker start `dl`
   0ab61f52d310
   root@hanayo:~# docker attach `dl`
    # 止まったかな？と思っても、Enterを押してください。bashが返ってきますヨ！
   bash-4.2# 
   bash-4.2# rpm -qa | grep ^gcc 
   gcc-4.8.2-16.el7.x86_64

ちゃんと gcc もインストールされていますね。このまま ``exit`` すると、この仮想マシンはExitedの状態になってしまいます。起動したままにするには、 ``ctrl + p`` のあとに、 ``ctrl + q`` を押して抜けます [#iidockerctrlp]_ 。

.. [#iidockerctrlp] ctrl+pがdockerに取られているので一つ前のコマンドを実行するときは crtl+pを二回押すか、↑キーを押す

.. code-block:: sh

   CONTAINER ID IMAGE          COMMAND   CREATED        STATUS       (PORTSに続く)
   0ab61f52d310 centos:centos7 /bin/bash 20 minutes ago Up 5 minutes (furious_mayerに続く)
   31318abf2f23 centos:centos7 /bin/bash 23 minutes ago Exited (130) (21に続く)
   
            PORTS NAMES
                  furious_mayer       
   21 minutes ago prickly_bardeen 

今度は、STATUSがUPになってますね。これで起動中のコンテナが出来ました！あとはいらないコンテナを削除しましょう。

.. code-block:: sh

   # docker rm prickly_bardeen 
   prickly_bardeen


簡単なアプリケーションを作ってみる
"""""""""""""""""""""""""""""""

redisのコンテナと、apache+phpが入ったコンテナを作って、redisの情報を取ってくるサンプルアプリケーションを作ってみます。まずは、redisのイメージ [#iidocredis]_ を取ってきてコンテナを起動します。

.. [#iidocredis] https://registry.hub.docker.com/_/redis/

.. code-block:: sh

   root@hanayo:~# docker pull redis
   root@hanayo:~# docker run -d -p 6379:6379 redis
   root@hanayo:~# docker ps -a
   CONTAINER ID IMAGE     COMMAND      CREATED        STATUS        (PORTSに続く)
   ccb90d29d571 redis:2.8 redis-server 13 seconds ago Up 12 seconds (0.0.0.0に続く)
  
   PORTS                  NAMES
   0.0.0.0:6379->6379/tcp drunk_pike


``-p`` オプションはホストOSと、コンテナのポートマッピングを指定しています。 ``docker ps -a`` で、redisのコンテナが起動したことが確認できました。
ホストOSにredisのインスタンスが起動している感覚で、実はそのインスタンスは仮想マシンの中で起動しているというイメージです。
ホストOSで、 ``telnet localhost 6379`` を打ってから info を打つと、redisの情報が返ってきます。なお、quitを打つと抜けられます。

つぎに、apacheとphpの入ったコンテナを作ります。redisのような、ちょうどよいイメージが無いため自分で作ります。このようなコンテナを作ります：

* centosのイメージを元にする
* apacheとphp(with phpredis)をインストールする
* apacheを起動する
* sshでログイン可能にする

プロジェクトのディレクトリを作ってsshでログインするために公開鍵を作ります。

.. code-block:: sh

   mkdir docker-centos
   ssh-keygen -t rsa -N "" -f .ssh/id_rsa
   cp .ssh/id_rsa.pub docker-centos

docker-centosディレクトリの中に、Dockerfileを作ります。Dockerfileとは、どのようなイメージを元に、コンテナの中で実行するコマンドを書いたファイルです。
Dockerfileのサンプルは、https://github.com/docker/docker/blob/master/Dockerfile にあります。今回はこのようなDockerfileをつくりました [#iidocredisd]_ 。
誌面の関係で折り返ししている部分があります。本来は一行で書きます。

.. [#iidocredisd] 先ほど使ったredisイメージにもDockerfile(https://github.com/dockerfile/redis/blob/master/Dockerfile)があります。

:: 

   FROM centos
   RUN yum update -y
   RUN yum install -y openssh-server wget unzip gcc make python-setuptools 
                      vim pcre-devel libxml2-devel autoconf
   RUN yum install -y tar bzip2 apr-devel apr-util-devel ; true
   RUN yum clean all
   RUN easy_install supervisor
   
   # apache
   RUN cd /tmp && wget http://ftp.kddilabs.jp/infosystems/apache//httpd
       /httpd-2.4.10.tar.bz2
   RUN cd /tmp && tar jxvf httpd-2.4.10.tar.bz2
   RUN cd /tmp/httpd-2.4.10 && ./configure --enable-so && make &&make install 
   RUN echo "みんなーっ！ご飯炊けたよっ♪" > /usr/local/apache2/htdocs/index.html
   RUN echo "AddType application/x-httpd-php .php" >> 
       /usr/local/apache2/conf/httpd.conf 
   RUN echo "LoadModule php5_module modules/libphp5.so" >> 
       /usr/local/apache2/conf/httpd.conf
   ADD redis.php /usr/local/apache2/htdocs/redis.php
   
   # php 
   RUN cd /tmp && wget http://jp2.php.net/distributions/php-5.5.15.tar.gz &&
       tar zvxf php-5.5.15.tar.gz && cd php-5.5.15/ && 
       ./configure  --with-apxs2=/usr/local/apache2/bin/apxs && make &&
       make install
   
   # phpredis
   RUN cd /tmp && wget ¥
       https://github.com/nicolasff/phpredis/archive/master.zip
   RUN cd /tmp && unzip master.zip
   RUN cd /tmp/phpredis-master && phpize && ./configure && make &&
       make install
   RUN echo "extension=redis.so" >> /usr/local/lib/php.ini
   RUN sed -i -e "s|;date.timezone =|date.timezone = Asia/Tokyo|"
       /usr/local/lib/php.ini
   
   # SSH
   ADD id_rsa.pub /root/id_rsa.pub
   RUN mkdir -p /root/.ssh/ /var/run/sshd
   RUN cp /root/id_rsa.pub /root/.ssh/authorized_keys
   RUN chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys
   RUN /usr/bin/ssh-keygen -t rsa  -f /etc/ssh/ssh_host_rsa_key -N ''
   RUN /usr/bin/ssh-keygen -t ecdsa  -f /etc/ssh/ssh_host_ecdsa_key -N ''
   RUN sed -i -e 's/^UsePAM yes/UsePAM no/' /etc/ssh/sshd_config

   # supervisor
   RUN mkdir -p /var/log/supervisor
   ADD supervisord.conf /etc/supervisord.conf
   EXPOSE 22 80
   CMD ["/usr/bin/supervisord"]


簡単にこのDockerfileの解説をします。

FROM centos
  centosのイメージを元に、それ以下のコマンドで変更を加えます

RUN yum update -y
  RUNの後に、コマンドが書けます

ADD supervisord.conf /etc/supervisord.conf
  ホストOSのファイルを、コンテナにコピーします

# supervisorの部分
  sshd, apacheをsupervisordでデーモン化しています。本来、1つのコンテナには1つのプロセスしか立ち上げません。sshdでログインしたいのであれば、こうしてデーモン化できます [#iidockersup]_ 

# apacheの部分
  ソースからインストールしています。理由は後述します。また、phpの実行ができるように、設定ファイルに変更を加えます

# phpの部分
  apacheのインストールをソースから行ったため、phpもソースからインストールすることになりました

EXPOSE
  コンテナ内部でこのポート番号を使うというのを宣言する命令(INSTRUCTION)です

.. [#iidockersup] supervisordを使うためのdockerのドキュメントはこちら：https://docs.docker.com/articles/using_supervisord/


supervisordの設定ファイルである、supervisord.confはこのように記述します。Dockerfileと同じディレクトリに配置します。

:: 

   [supervisord]
   nodaemon=true
   
   [program:httpd]
   command=/usr/local/apache2/bin/httpd -DFOREGROUND
   
   [program:sshd]
   command=/usr/sbin/sshd -D


redisのコンテナのIPアドレスを置換する前のredis.php.templateを作ります。

:: 

   <?php
   $ip = '172.0.0.1';
   $redis = new Redis();
   $redis->connect($ip, 6379);
   $redis->set('hanayo', '白いご飯が足りません');
   var_dump($redis->get('hanayo'));

ビルドして、イメージを作り、コンテナを起動します。

.. code-block:: sh

   root@hanayo:# IP=$(docker inspect $(docker ps -a | awk /redis-server/'{print $1}') | awk -F \" /IPAddress/'{print $4}')
   root@hanayo:# sed -e "s/127.0.0.1/"$IP"/" redis.php.template > redis.php
   root@hanayo:# docker build -t centos:ap .
   root@hanayo:# docker run -d -p 10022:22 -p 80:80 centos:ap
   root@hanayo:# docker ps -a
   CONTAINER ID IMAGE     COMMAND              CREATED       STATUS        PORTS                                     NAMES
   042bce159434 centos:ap /usr/bin/supervisord 5 seconds ago Up 5 seconds  0.0.0.0:80->80/tcp, 0.0.0.0:10022->22/tcp nostalgic_shockley   
   e6df5aeac928 redis:2.8 redis-server --bind  10 days ago   Up 12 minutes 0.0.0.0:6379->6379/tcp                    loving_lumiere  
   root@hanayo:~/docker-centos# curl localhost/redis.php
   string(30) "白いご飯が足りません"

一行目で、redisが立ち上がっているコンテナのIPを取得しています。コンテナ間同士は、相手のIPを知らないと通信できないからです。 ``doker inspect NAME`` でも、コンテナの詳細な情報をjson形式で取得することができます。

docker build -t centos:ap .
  Dockerfileをもとに、イメージを作ります。今回はcentosというイメージでTAGをapとしました

docker run -d -p 10022:22 -p 80:80 centos:ap
  コンテナのポート番号10022をホストOSのポート番号22へ、コンテナのポート番号80をホストOSのポート番号80にバインドしています。指定していない場合、たとえば ``run -d -p :22 -p :80 centos:ap`` とすると、ホストOSの49100-49199のポート番号へ自動的にバインドされます


.. topic:: このDockerfileができるまで

   Dockerfileの中で、 ``yum install httpd`` ができません。こちらのバグを踏みます。Bug 1012952 - docker: error: unpacking of archive failed on file /usr/sbin/suexec: cpio: cap_set_file [#]_ 。apacheをソースからインストールすることになりました。また、aprの依存パッケージをインストールするところで同じように失敗します。パッケージがインストールできなくても問題ありませんが、exit statusが0以外だとDockerfileのビルドが止まるため、 `` ; true `` で応急処置をしています。

   .. [#] https://bugzilla.redhat.com/show_bug.cgi?id=1012952

   centosイメージを使うと、CentOS 7となるため、サービスの起動はsystemdになります。systemd経由で、例えばapacheを起動しようとするとこのバグを踏みます：Bug 1033604 - Unable to start systemd service in Docker container [#iibug1]_ 。「dockerはアプリケーションコンテナモデルである。systemdで起動してはいけない。デーモンで直接起動しよう」という回答がありました。

   sshでのログインでは、mizzyさんの記事「Dockerコンテナに入るなら SSH より nsinit が良さそう」 [#]_ を見つけました。やってみたところ、go getのところで詰まり、断念。「RHEL/CentOS 6で Docker に nsinit/nsenter する」 [#]_ の記事を見つけたものの、手順が煩雑なので諦めました。結局、supervisordに落ち着きました。PAMをoffにしていないとログインできなかったりと、様々な罠がありました。
   
   .. [#iibug1] https://bugzilla.redhat.com/show_bug.cgi?id=1033604
   .. [#] http://mizzy.org/blog/2014/06/22/1/
   .. [#] http://qiita.com/comutt/items/2f873a0e7eaddd3f647e

   phpのビルドを行ったとき、 ``make -j2`` (2つのjobを同時に実行)したところ「virtual memory exhausted: Cannot allocate memory」と言われてしまいました。コンテナの中では、ビルドするものではありません。 ``make`` だとOK。実行環境はDigitalOceanの最小インスタンス(512MBメモリ)でした。


補足
""""""

* Dockerは新しいツールのため、枯れているという感じがありませんでした。このあともかなりの頻度でアップデートされることが予想されるので、この内容は役に立たないかもしれません。そのときはPull reqいただければありがたいです

* ここで触れていない内容として、コンテナのデータの永続化があります。mopemopeさんの「Docker でデータのポータビリティをあげ永続化しよう」 [#]_ が参考になります。また、dockerはhostsが書き換えられないため、工夫が必要になります。JAGAxIMOさんの「Dockerで/etc/hostsファイルが操作出来ない対策」 [#]_ を参考にしてください

* コマンドのチュートリアルは、curseoffさんの「Dockerコマンドメモ」が手堅くまとまっています。Vagrantを使って少し進んだチュートリアルはdeeeetさんの「実例で学ぶDockerコマンド」 [#]_が有用です

* VagrantでCoreOSの仮想マシンを立ち上げて、そこでDockerを使ってアプリケーションの開発を行うという手法が主流になっているそうです [#]_ 

* DaaS(Docker as a Service)の会社がでてきました。例えば、Orchard、Stackdock、tutumです


.. [#] http://qiita.com/mopemope/items/b05ff7f603a5ad74bf55
.. [#] http://qiita.com/curseoff/items/a9e64ad01d673abb6866
.. [#] http://qiita.com/JAGAxIMO/items/6b71a03518bbd53d4de6
.. [#] http://qiita.com/deeeet/items/ed2246497cd6fcfe4104
.. [#] http://coreos.com/docs/launching-containers/building/getting-started-with-docker/


Cobbler
^^^^^^^^^

Bootstrappingの層に入っていきます。今回はCobblerを取り上げます。

Cobbler [#]_ は、PXE Bootサーバをつくるとき、煩わしい部分をやってくれるツールです。DHCPサーバ、tftpサーバ、pxelinux.0の設定や、OSのインポートを一手に引き受けてくれます。
PXE Bootの仕組みは分かっているけど、いざ作ろうとするとやっぱり面倒という方向けです。

.. [#] http://www.cobblerd.org/

digitalOceanのcentos6.5にて実施しました。PXE bootはサポートされていませんが、LABELの追加までやってみます。yumでcobblerをインストールすると、httpdなどがインストールされます。pxelinux.0を持ってくるために、syslinuxパッケージも必要でした。なお、yumでインストールすると、Cobblerのバージョンは1.2.2でした。バージョン2.6系がリリースされているので古いです。

.. code-block:: sh

   yum install http://pkgs.repoforge.org/rpmforge-release/¥
   rpmforge-release-0.5.3-1.el6.rf.x86_64.rpm
   yum install cobbler syslinux  


必要に応じて、 ``/etc/cobbler/settings`` の下記の部分を書き換えます。

dhcpの設定をcobbler行う場合は、manage_dhcpを1にします。

::

   manage_dhcp: 1

Serverと next_server の設定をします。ここではテストのためデフォルト。

:: 

   server: 127.0.0.1
   next_server: 127.0.0.1

``/etc/cobbler/dhcp.template`` にdhcpd.confのテンプレートファイルがあるので、所属しているネットワークに合わせて編集します

.. code-block:: sh

   # service httpd start
   # service cobblerd start
   # cobbler check # 設定のチェックをします
   # cobbler sync # 設定ファイルを作ります

次に、OSの中身のインポートを行います。実際にPXE Bootサーバを作るとき一番面倒なところです。コマンド一発でできて素敵です。

.. code-block:: sh

   # cobbler import ¥ 
   --path=rsync://ftp.jaist.ac.jp/pub/Linux/scientific/6.5/x86_64/os/ ¥
   --name=SL6.5-x86_64

ダウンロードした中身は ``/var/www/cobbler/ks_mirror/SL6.5-x86_64/`` に置かれました。

.. code-block:: sh

   #  cobbler distro report --name SL6.5-x86_64
   Name                           : SL6.5-x86_64
   Architecture                   : x86_64
   TFTP Boot Files                : {}
   Breed                          : redhat
   Comment                        : 
   Fetchable Files                : {}
   Initrd                         : /var/www/cobbler/ks_mirror/SL6.5-x86_64/i
   Kernel                         : /var/www/cobbler/ks_mirror/SL6.5-x86_64/i
   Kernel Options                 : {}
   Kernel Options (Post Install)  : {}
   Kickstart Metadata             : {'tree': 'http://@@http_server@@/cblr/lin
   Management Classes             : []
   OS Version                     : generic26
   Owners                         : ['admin']
   Red Hat Management Key         : <<inherit>>
   Red Hat Management Server      : <<inherit>>
   Template Files                 : {}

``/tftpboot/pxelinux.cfg/default`` を見てみると、LABELが追加されています。

:: 

   LABEL SL6.5-x86_64
           kernel /images/SL6.5-x86_64/vmlinuz
           MENU LABEL SL6.5-x86_64
           append initrd=/images/SL6.5-x86_64/initrd.img ksdevice=bootif lang 
           ipappend 2


手元の環境では、実際にPXE Boot出来る環境がないのでここまでです。
デフォルトのPXE Bootの画面よりもCobblerのPXE Bootの画面の方が使いやすくなっています。


参考
""""""

* CobblerでScientific Linux 6.1を導入 : 
  http://blog.glidenote.com/blog/2012/02/03/cobbler-scientific-linux-6.1/
* cobbler を使ってみた : http://www.sssg.org/blogs/naoya/archives/855


Surf
^^^^^^

Surf [#serfdom]_ は、クラスタ管理を行うツールです。ゴシッププロトコル [#iigos]_ で通信します。クラスタ管理は分散型なので、障害に強いです。
IIの世界での使い方としては、新しいサーバが追加されたとき、他のサーバに自分が参加したことを伝えたり、不調で切り離されたサーバをほかのサーバが検知してクラスタから切り離されたりします。
カスタムイベントを発行できるため、新しいサーバが加わったときに、hostsファイルの更新を行ったり、ロードバランサに追加したりすることができます。

.. [#serfdom] http://www.serfdom.io/
.. [#iigos] http://en.wikipedia.org/wiki/Gossip_protocol

インストールしてみましょう。各ディストリビューション向けに、パッケージが用意されています。今回はlinux amd64をダウンロード。zipを解凍すると、そこには ``serf`` のバイナリが入っていました。
実験する環境は、毎度おなじみDigitalOceanの最小構成のDropletです。Dropletを(sachiko, nana)用意して、Private Networkを有効にしています。

sachikoでagentを立ち上げます。

.. code-block:: sh

   wget https://dl.bintray.com/mitchellh/serf/0.6.3_linux_amd64.zip
   unzip 0.6.3_linux_amd64.zip
   ls 
   0.6.3_linux_amd64.zip serf
   sudo cp serf /usr/local/bin/

Agentを起動します [#iiserfagent]_ 。

.. [#iiserfagent] この状態で、0.0.0.0を7946portでLISTEN、localhostを7373portでLISTENしています

.. code-block:: sh

   $ serf agent 
   ==> Starting Serf agent...
   ==> Starting Serf agent RPC...
   ==> Serf agent running!
            Node name: 'sachiko'
            Bind addr: '0.0.0.0:7946'
             RPC addr: '127.0.0.1:7373'
            Encrypted: false
             Snapshot: false
              Profile: lan
   
   ==> Log data will now stream in as it occurs:
   
       2014/08/03 03:55:24 [INFO] agent: Serf agent starting
       2014/08/03 03:55:24 [INFO] serf: EventMemberJoin: sachiko 10.130.215.135
       2014/08/03 03:55:25 [INFO] agent: Received event: member-join



端末が返ってこないのでctrl+cでserf agentが終了します。initスクリプト [#iiserfini]_ があるので、そちらを使ったほうが楽です。

.. [#iiserfini] http://pocketstudio.jp/log3/2013/11/25/sysv_init_script_for_serf/

sachikoのプライベートネットワークのIPアドレスをメモ(今回は10.130.215.135)して、nanaへ移ります。nanaでもserfをインストールしてagentを立ち上げます。バックグラウンドで立ち上げます。

.. code-block:: sh

   [abe@nana ~]$ serf agent &
   [abe@nana ~]$ serf join 10.130.215.135

sachikoのログ曰く

:: 

   2014/08/03 04:09:43 [INFO] serf: EventMemberJoin: nana 10.130.215.141
   2014/08/03 04:09:44 [INFO] agent: Received event: member-join

join完了しました。membersで一覧が出ます。

.. code-block:: sh


   [abe@nana ~]$ serf members
      2014/08/03 04:13:41 [INFO] agent.ipc: Accepted client: 127.0.0.1:59989
    nana     10.130.215.141:7946  alive  
    sachiko  10.130.215.135:7946  alive

イベントを発行してみます。

.. code-block:: sh

   [abe@nana ~]$ serf event '自称・17さい'
   2014/08/03 04:15:03 [INFO] agent: Received event: user-event: 自称・17さい

sachiko [#iikousiki]_ のログにも、出ています。

.. [#iikousiki] 公式プロフィールでは14さいです

:: 

   2014/08/03 04:15:03 [INFO] agent: Received event: user-event: 自称・17さい

イベントを実行してみます。nanaをクラスタから外してみます。サーバを行ったり来たりしているのでコマンドを実行しているホストに注意。

.. code-block:: sh

   [abe@nana ~]$ serf leave

   [koshimizu@sachiko ~]$ serf members
       2014/08/03 04:50:55 [INFO] agent.ipc: Accepted client: 127.0.0.1:41356
   sachiko  10.130.215.135:7946  alive  
   nana     10.130.215.141:7946  left

復帰させてみます。

.. code-block:: sh

   [abe@nana ~]$ serf agent &
   [abe@nana ~]$ serf join 10.130.215.135

   [koshimizu@sachiko ~]$ serf members
       2014/08/03 04:53:24 [INFO] agent.ipc: Accepted client: 127.0.0.1:41362
   sachiko  10.130.215.135:7946  alive  
   nana     10.130.215.141:7946  alive

nanaが復帰しました。leaveはクラスタから外れるイベントです。その他にも、join,failed,update,reapなどがあります。

イベントが実行された時に任意のスクリプトを実行できるようにしてみましょう。スクリプトファイルはこのような感じで作ります。

:: 

   #!/bin/bash
   echo "ウサミンパワーでカラフルメイドにメルヘンチェンジ！"

agentを終了して、イベントハンドラにスクリプトファイルを指定して起動します。ログレベルをdebugにしないと表示されません。

.. code-block:: sh

   [abe@nana ~]$ serf agent -log-level=debug -event-handler=./script.sh
   (略)
       2014/08/03 05:39:27 [DEBUG] agent: Event 'member-join' script output: 
       ウサミンパワーでカラフルメイドにメルヘンチェンジ！

実行できました。次はイベントに名前を作ってそれを実行してみましょう。プロディーサーさんがお部屋に訪問した時のセリフを出してみましょう [#iitekitou]_ 。
各Dropletでスクリプトを作り、serf agentを実行するときに指定します。visitというイベント名として登録し、visitイベントを呼び出すとスクリプトが実行されます。

.. [#iitekitou] 適当

.. code-block:: sh

   [koshimizu@sachiko ~]$ chmod +x sachiko.sh ; cat sachiko.sh 
   #!/bin/sh
   echo "プロデューサーさん、女の子の扱いを知らないなんて可哀想ですね！」"

   [abe@nana ~]$ chmod +x usamin.sh ; cat usamin.sh 
   #!/bin/bash
   echo "はーい今出ま…って、プロデューサーさん!？えっ、ま、まぁ汚い部屋ですがどうぞ！あっ、こ、

   [koshimizu@sachiko ~]$ serf agent -log-level=debug -event-handler ¥
                        > user:visit=./sachiko.sh &

   [abe@nana ~]$ serf agent -log-level=debug -event-handler ¥
               > user:visit=./usamin.sh &

   [abe@nana ~]$ serf join 10.130.215.135

   [koshimizu@sachiko ~]$ serf event visit
       2014/08/03 06:08:41 [DEBUG] agent: Event 'user' script output: プロデュ

   [abe@nana ~]$ # 標準出力に表示されます
   2014/08/03 06:08:42 [DEBUG] agent: Event 'user' script output: はーい今出ま…

eventは全てのクラスタで実行されるため、usaminで、 ``serf event visit`` を実行しても同じ結果になります。


参考
"""""

* 正月休みだし Serf 触ってみた : http://blog.livedoor.jp/sonots/archives/35397486.html
* Serfが面白いと俺の中で話題にwwwwww : http://www.slideshare.net/zembutsu/serf-the-liberator
* Serf 虎の巻 : http://deeeet.com/writing/2014/03/23/serf-basic/
* Serf Demo: Web Servers + Load Balancer : https://github.com/hashicorp/serf/tree/master/demo/web-load-balancer


その他の問題
------------

IIを使っていく上で避けては通れない問題について触れていきます。

ログの管理
^^^^^^^^^^^^^^^^^^^

本番環境で動作しているサーバは、日々、ログが蓄積されていきます。インスタンスを作って壊すことが簡単になると、保存しておくべきログはどうやって残しておくか、ということが問題になります。
解決策としては、Fluentd [#]_ を使うのが主流です。リアルタイムに収集できますし、取得したログをElasticsearch [#]_ と kibana [#]_ で可視化している、というところも多いのではないでしょうか。

.. [#] http://www.fluentd.org/
.. [#] http://www.elasticsearch.org/
.. [#] http://www.elasticsearch.org/overview/kibana/


サーバの監視
^^^^^^^^^^^^^^^^^^^^

インスタンスを作って壊すことが多くなると、サーバのモニタリングツールに登録しているホストが消えることがあります。すると、過去のトレンドが見えなくなってしまいます。
従来、ホストをモニタリングツールに登録するところですが、ホストを役割としてグルーピングしてモニタできる mackerel(マカレル) [#]_ があります。途中でノードが無くなっても、モニタリングを継続できる監視ツールです。

.. [#] https://mackerel.io/ mackerelの意味は鯖

nanaとsachikoのサーバにインストールしていました。このような感じでモニタリングできました。

.. figure:: img/nana-sachiko.eps
  :scale: 70%
  :alt: nana-sachiko
  :align: center

  nanaとsachikoの通信量のモニタリング

mackerel のサイトに登録して、RPMなどのパッケージがあるのでモニタ対象のサーバにインストール。設定ファイルをコピペで貼付け、サービスを起動すればモニタリングが始まります。


まとめ
-------

Orchestration、Configuration、Bootstrapping、Agent、Testで使われるツールをひと通り触ってきました。
取り上げたツールをうまく組み合わせると、本番のデプロイや、アプリケーションの開発が便利になるかもしれません。
例えば、 mackerel をインストールするAnsibleのplaybookを書いて、それをVagrantのプロビジョンとして指定、そのVagrantのプロバイダーをDigitalOceanにすれば1つシステムができあがります。
本記事には出てきていないPacker [#iipacker]_ があります。VirtualBoxやAmazon EC2、DigitalOcean用のイメージファイルを作るためのツールです。kickstartファイルからイメージを作成し、インストールされているパッケージが本番環境と同じOSイメージを開発者に渡して、Vagrantでアプリケーションの開発を行うことができます。
さらに、githubにpushが発生した時、jenkinsおじさんがそれを察知、イメージふぁいるにプログラムを流し込み、そのままServerspecでテストを走らせることも可能になります。

.. [#iipacker] http://www.packer.io/

ツールの組み合わせ次第で、いままで手作業だったり、手を動かいてチェックする部分を自動化することが出来ます。ただ、いろいろなツールが乱立しているので、どのツールを組み合わせるか、というのが重要になってきます。ツール自体も一長一短があります。現在進行形で、やりたいことを実現するためにはどうするか手探り状態です。
新しい技術ももちろん重要ですが、忘れがちな古い技術も組み合わせて、事故のないデプロイをしていきましょう。

今回使ったサンプルコードには、 https://github.com/tboffice/nanaka5-ii においてあります。


スペシャルサンクス
-----------------

* @eigo_s (https://twitter.com/eigo_s | Vagrant,Packerでアドバイスいただきました)
* @ringohub (https://twitter.com/ringohub | Vagrantでアドバイスいただきました)
* @JAGAxIMO (https://twitter.com/JAGAxIMO | Dockerで困った時助けていただきました)
* @r_rudi (https://twitter.com/r_rudi | Ansibleでツッコミ頂きました)
* @mtgto (https://twitter.com/mtgto | 査読していただきました)
* 先人のblogの記事(各ツールの最後にURLを載せています)


おまけ
-----------------

トレンドを追いかけるために見ておいたほうが良い文献です。

* hashicorp http://www.hashicorp.com/blog
* kief morris http://kief.com/
* Martin Fowler http://martinfowler.com/
* chad fowler http://chadfowler.com/

英語ですが、翻訳すれば雰囲気はつかめます。

* 今さら聞けない Immutable Infrastructure - 昼メシ物語 : http://blog.mirakui.com/entry/2013/11/26/231658

  - IIについての話題をコンパクトにまとめている記事です。ここで出てこないトピックもたくさんあります


参考文献
--------
「継続的デリバリー 信頼できるソフトウェアリリースのためのビルド・テスト・デプロイメントの自動化」アスキー・メディアワークス,2012
「入門Ansible」(http://www.amazon.co.jp/dp/B00MALTGDY/),2014
「WEB+DB PRESS vol.81」技術評論社,2014

