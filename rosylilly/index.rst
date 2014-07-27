AWS をコード化する
==================

おはようございます。最近、暑さにやられていて人生を儚んでいる鳩こと、ロージーです。

今回は AWS をコード化する、ということで、実際に使用している、いくつかのコード例と共に、 AWS の各パーツをコード化していきましょう。

序文: なぜコード化するのか
--------------------------

本題に入る前に、まずはなぜコード化しなくてはならないのか、何が嬉しいのか？について少しお話します。

まず筆者のことから話していくと、インフラ周りはさっぱりの、もっぱらフロントやサーバーサイドアプリケーションを書くのがメインの仕事をいままでやってきました。自分のドメインをいくつか所持していたり、 VPS を借りてサーバーで遊んだり、ということはいくらかやってきましたから、まったくのズブの素人、という訳でもなく、なんとなくわからなくもないけど深い知識や知見などは一切ない、という状態です。

こういう状態の人間がインフラを触り始めるとほぼ確実に起こすミスとして、『何をしたのか覚えていないので再現できない』というのがあります。たとえば、新しく起動した EC2 上でセットアップをしたものの、どういうセットアップをしたのか覚えていない、 Route 53 を使って設定したが、どれを設定し終えて、どれがまだなのかわからなくなった、などなど。AWS コンソールは非常に良く出来ており、GUI をつかって手軽に AWS を扱うことが出来ますが、手軽にできすぎて何をしたのか、何をしてないのかわからなくなってしまう、ということが多々あります。

かといって、何をしたのか全部記録しておきましょう！といっても難しいものがあります(今は CloudTrail がありますから、記録するだけならそんなに手間もなく行えるのですが)。できれば作業と同時に記録を行い、かつ後で見返すのが容易で、もっと言うなら実行前に誰かにレビューしてもらえるのが望ましいでしょう。

AWS をコード化する、ということは、作業手順書をなくし、作業そのものがコード化されることで記録・レビュー・実行を1つのコードからワンストップで扱えることになるということです。なので、AWS のコード化は慣れた人よりも初心者こそやるべきだと思っています。

AWS の操作をコード化しておくことで、様々な恩恵を得られるのは間違いないですが、一旦難しいことは考えず、ぱぱっとやっていきましょう。

Route 53
--------

ドメインの設定はとても重要です。設定がミスしていると大変なことになりますし、出来る限りヒューマンエラーを無くしたい箇所でしょう。

今回は Ruby で実装された roadworker(\ https://github.com/winebarrel/roadworker) を利用して Route 53 の設定をコード化していきましょう。

roadworker のインストールと設定
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

特に難しいことはありません。素直に ``gem install roadworker`` でインストールをしましょう。rbenv をお使いの場合は、インストール後に ``rbenv rehash`` を行うのを忘れないように気をつけてください。

roadworker はコマンドライン引数から AWS のアクセスキーとシークレットアクセスキーを渡すことが出来ますが、できれば ``AWS_ACCESS_KEY_ID`` と ``AWS_SECRET_ACCESS_KEY`` を利用した認証を使用しましょう。

また、バージョンを固定する、インストールの簡略化という意味でも、Gemfile をプロジェクトルートに配置して、roadworker を追加しておくのもよいでしょう。Bundler で管理できるようになり、より便利に取り扱う事ができます。

最初の一歩: Export による Routefile の生成
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

roadworker は **Routefile** と呼ばれる独自の DSL を解釈して、 Route 53 の設定を行います。ただ、現在の設定を上書きなどしてしまうと問題ですので、現在の Route 53 の設定を書き出すところから始めましょう。

.. code:: shell

    $ roadwork -e -o Routefile
    # Bundler で管理している場合は以下
    $ bundle exec roadwork -e -o Routefile

上記のコマンドを実行すると、カレントディレクトリの ``Routefile`` に Route 53 の現在のレコードがすべて出力されます。

.. code:: ruby

    hosted_zone "example.com." do
      rrset "example.com.", "A" do
        ttl 300
        resource_records(
          "127.0.0.1",
          "127.0.0.2"
        )
      end
    end

Protip: 上書き注意！
''''''''''''''''''''

roadworker による Export は現在の設定内容を書き出してくれますが、当然、現在の Routefile の書式に合わせるといった変換は行われません。そのため、うっかり書き出してしまうと現在の Routefile の内容が失われてしまう、といったことも起こりえます。

``-o`` オプションを付けないことで、標準出力に Export 結果を出力してくれますから、単に確認を行うだけの場合には ``-o`` を付けず、標準出力に書きだすようにすることをオススメします。

roadworker の DSL を理解する
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``hosted_zone``
^^^^^^^^^^^^^^^

そのまま、Route 53 の Hosted Zone のことを指しています。たとえば、 ``nicovideo.jp`` なら、

.. code:: ruby

    hosted_zone "nicovideo.jp." do
      # ...
    end

と記述します。最後の ``.`` が必須なことを忘れないように気をつけてください。

この ``hosted_zone`` に渡すブロックの中で、その Hosted Zone の各 Record Set の設定を行っていきます。

``rrset``
^^^^^^^^^

Route 53 の Record Set のことを指しています。Hosted Zone 内の A レコードなどの具体的な設定の記述になります。

たとえば、 ``blog.nicovideo.jp`` を Tumblr で運用する、といった設定の場合

.. code:: ruby

    hosted_zone "nicovideo.jp." do
      rrset "blog.nicovideo.jp.", "CNAME" do
        ttl 300
        resource_records(
          "domains.tumblr.com."
        )
      end
    end

といった形で、 ``domains.tumblr.com`` への CNAME のレコードを設定すればよいでしょう。

その他属性値
^^^^^^^^^^^^

``ttl``\ 、\ ``resource_records`` などは、一般的な DNS で設定する内容そのままですから、あまり混乱はないかと思います。ですが Route 53 には他の DNS にはないユニークな機能が幾つか搭載されており、その制御も roadworker から行うことが出来ます。

ここでは2つの機能を紹介します。

Elastic Load Balancer や S3 を用いた場合の Alias A レコード
'''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

Elastic Load Balancer を使って、動的な IP の付与とロードバランシングを行う場合、 CNAME で ELB 名を指定するのではなく、A レコードの ALIAS を使って指定することが出来ます。

Management Console では A レコードタイプを選択して Alias オプションを有効にすることで指定を行うことが出来ますが、 roadworker を利用する場合、以下のような指定で、目的の設定を行う事ができます。

.. code:: ruby

    hosted_zone "nicovideo.jp." do
      rrset "www.nicovideo.jp.", "A" do
        dns_name "niconico-frontend-elb-123456789.ap-northeast-1.elb.amazonaws.com."
      end
    end

S3 に Alias を設定する場合も同様に

.. code:: ruby

    hosted_zone "nicovideo.jp." do
      rrset "www.nicovideo.jp.", "A" do
        dns_name "www.nicovideo.jp.s3.amazonaws.com."
      end
    end

という具合に指定してあげれば問題ありません。

Failover を利用した動的なドメイン切り替え
'''''''''''''''''''''''''''''''''''''''''

Route 53 には Failover 機能があり、ヘルスチェックと組み合わせることで、サービスダウン時には自動的にレコードを切り替える、といった運用が可能になります(もちろん、クライアント側で名前解決結果をキャッシュしている可能性がありますから、過信は禁物ですが)。

.. code:: ruby

    hosted_zone "nicovideo.jp." do
      rrset "www.nicovideo.jp.", "A" do
        set_identifier "Primary"
        failover "PRIMARY"
        health_check(
          "http://www.nicovideo.jp/health",
          search_string: "OK",
          request_interval: 30,
          failure_threshold: 3
        )
        dns_name "niconico-frontend-elb-123456789.ap-northeast-1.elb.amazonaws.com."
      end

      rrset "www.nicovideo.jp.", "A" do
        set_identifier "Secondary"
        failover "SECONDARY"
        dns_name "www.nicovideo.jp.s3.amazonaws.com."
      end
    end

上記のような記述をしておくことで、 ``http://www.nicovideo.jp/health`` に 30 秒ごとにヘルスチェック確認が行われるようになります。この際に ``search_string`` に指定した **OK** という文字列がレスポンスに含まれなかった場合、ヘルスチェックは失敗と判定され、 ``failure_threshold`` で指定した回数ヘルスチェックに失敗すると、自動的にセカンダリに指定した S3 の Alias が返るようになります。

静的リソース配信やサービスメンテナンス、突発的障害発生時の救済措置として設定しておくとよいでしょう。

プログラマブル DNS
~~~~~~~~~~~~~~~~~~

roadworker は Ruby で実装されており、その DSL も Ruby 上で動作する Ruby スクリプトとして解釈されます。ということは、Ruby そのものの機能を活用して、プログラマブルな DNS を構築出来ることになります。

単純に DSL のみで記述することももちろん簡単ですが、もう一歩発展した使い方をすることで、よりよい DNS 設定を構築しましょう。

単純なレコードは YAML で管理したい
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Amazon Simple Email Service や Google Analytics など、DNS レコードに指定の値を設定しなければいけない場面は多くあります。こういったものまでいちいち DSL で記述するのは面倒ですから、 YAML で管理出来るように改造してしまいましょう。

まずは、YAML の読み込みを出来るように Routefile を修正します。

.. code:: ruby

    # Routefile
    require 'yaml'

    hosted_zone "nicovideo.jp." do
      defined_by_yaml = YAML.load_file("./nicovideo.jp.yml")
    end

これで、\ ``nicovideo.jp.yml`` の中身が ``defined_by_yaml`` に代入出来るようにりました。YAML の書式は好きなように決めるとして、今回はこんな感じにしてみます。

.. code:: yaml

    # nicovideo.jp.yml
    - name: "www.nicovideo.jp"
      type: "A"
      ttl: 300
      values:
        - "192.168.0.1"
        - "192.168.0.2"

ルートは配列で、中に ``rrset`` の名前とレコードタイプ、 TTL と値を入れられるようにしておきます。あとは、Routefile の方でこの書式からエントリを作ってあげるだけですね。

.. code:: ruby

    # Routefile
    require 'yaml'

    hosted_zone "nicovideo.jp." do
      defined_by_yaml = YAML.load_file("./sample.yml")

      defined_by_yaml.each do |record|
        rrset(record["name"], record["type"] || "A") do
          ttl(record["ttl"] || 300)
          resource_records(*record["values"])
        end
      end
    end

これで単純なレコードであれば YAML を修正するだけで追加出来るようになりました。\ ``dns_name`` などを利用しない、単純なレコードはこのように YAML から読み込むようにしておくと、コードレビュー時も便利になります。YAML だとインデントベースなので運用が難しい、といった場合には適宜 JSON を使うなどの変更を行ってもよいでしょう。

TXT レコードや CNAME レコードなど、単純なレコードを記述するのにあまり苦労したくない……という場合にはより効果を発揮すると思われます。

Protip: ``--dry-run`` による確認
''''''''''''''''''''''''''''''''

単純な DSL であれば書式が間違っていないかをチェックするだけで十分でしたが、このようにコード化されていくと、最終的な結果を予測することが難しくなります。

そのため、 roadworker には ``--apply`` の実行時に使える ``--dry-run`` というオプションが組み込みで容易されています。先ほどの設定内容を試しに実行してみると、以下の様な出力が得られます。

.. code:: shell

    $ roadwork --apply --dry-run -f Routefile
    Apply `Routefile` to Route53 (dry-run)
    Create HostedZone: nicovideo.jp (dry-run)
    Create ResourceRecordSet: www.nicovideo.jp A (dry-run)
    No change

出力を確認することで期待する内容がきちんと設定されているかを確認しながら Routefile の編集・適用を行うことで、より安全に実行することが出来るようになります。

ダイナミックな DNS 設定
^^^^^^^^^^^^^^^^^^^^^^^

いままではプログラマブルとはいえ、設定内容はすべてコード上で表現されていました。ですが、現実にはより柔軟に DNS の設定を行いたいことが多々あります。例えば、ELB の増設を行った時に自動的に DNS も設定されて欲しい、などの状況です。

roadworker は aws-sdk という AWS 公式の gem を使って実装されているため、もちろん aws-sdk を使って、他の AWS コンポーネントの情報を取得することも簡単に行えます。

ここでは、aws-sdk と連携することで、ELB に付けられた名前から自動的に DNS レコードを設定するような Routefile を書いてみましょう。

DNS を設定する ELB を取得する
'''''''''''''''''''''''''''''

ELB 上のロードバランサを取得するのは以下のようなコードで簡単に行う事ができます。

.. code:: ruby

    require 'aws-sdk'

    # ec2_endpoint 及び elb_endpoint はご利用の region に併せて変更してください
    elb = AWS::ELB.new(
      ec2_endpoint: 'ec2.ap-northeast-1.amazonaws.com',
      elb_endpoint: 'elasticloadbalancing.ap-northeast-1.amazonaws.com'
    )
    load_balancers = elb.load_balancers

ここで気をつけなければならないことは ``load_balancers`` メソッドで返ってくるのは『全ての』ELB ロードバランサだということです。すべてということは、内部用に設定され外部に公開されていない Intenal ELB も含まれていることになります。必ず ``schema`` が ちゃんと ``internet-facing`` になっているかを確認するコードを入れておかないと、おかしなことになりかねませんから、注意が必要です。

実際に DNS を設定する
'''''''''''''''''''''

次は、どのように DNS レコードと紐付けるかですが、ここは ELB 名の suffix が ``nicovideo-jp`` で終わる時のみ、その ``hosted_zone`` に名前を設定することとします。例えば ``www-nicovideo-jp`` という Name の設定された ELB は自動的に Route53 で ``www.nicovide.jp`` の A レコードとして設定される、という具合です。

.. code:: ruby

    # Routefile
    require 'aws-sdk'

    elb = AWS::ELB.new(
      ec2_endpoint: 'ec2.ap-northeast-1.amazonaws.com',
      elb_endpoint: 'elasticloadbalancing.ap-northeast-1.amazonaws.com'
    )
    load_balancers = elb.load_balancers

    hosted_zone 'nicovideo.jp' do
      load_balancers.each do |load_balancer|
        if load_balancer.scheme == 'internet-facing' && load_balancer.name.match(/nicovideo-jp$/)
          rrset load_balancer.name.gsub('-', '.'), 'A' do
            dns_name load_balancer.canonical_hosted_zone_name
          end
        end
      end
    end

これだけのコードで、十分に目的の挙動を行ってくれます。あまりに拍子抜けしてしまいましたか？これで十分なのです！記述がすっきりしただけでなく、今後は手動でレコードを追加していくといった手間からも開放されてしまいました。また ELB の設定もコード化することが出来ますから(これについては次の機会に記事を書かせていただきたいと思います)、組み合わせることで、より便利な環境が実現できるかと思います。

S3 もついでにやってしまおう！
'''''''''''''''''''''''''''''

あまりにも簡単に ELB を自動的に Route 53 に設定することが出来てしまいましたから、この勢いで S3 のバケットによる静的サイトを Route 53 を使って DNS 設定するということもやってしまいましょう。

S3 のバケット一覧を取得するには、以下のようなコードで簡単に取得することが出来ます。

.. code:: ruby

    require 'aws-sdk'

    s3 = AWS::S3.new
    buckets = s3.buckets

あとは、\ ``nicovideo.jp`` で終わるバケット名が指定されているものを取得して DNS レコードを設定していきましょう。

.. code:: ruby

    # Routefile
    require 'aws-sdk'

    s3 = AWS::S3.new
    buckets = s3.buckets

    hosted_zone 'nicovideo.jp' do
      buckets.each do |bucket|
        if bucket.website? && bucket.name.match(/nicovideo.jp$/)
          rrset bucket.name, "CNAME" do
            resource_records("#{bucket.name}.s3-website-ap-northeast-1.amazonaws.com.")
          end
        end
      end
    end

``bucket.website?`` を利用して Web サイトホスティング設定されているものだけに絞っています。もっと難しくて長々しいものを期待していたでしょうか？たったこれだけで終わってしまいます。

全部入りの Routefile
^^^^^^^^^^^^^^^^^^^^

さて、ここまで『シンプルなレコード設定は YAML で』『ELB は名前から自動的に』『S3 も名前から自動的に』設定してくれる Routefile を作ってきました。最後にはすべてを組み合わせた Routefile を作ってみます。とはいえ、難しいことは何もありません。すべてをつなげてしまえばいいのです。

.. code:: ruby

    # Routefile
    require 'yaml'
    require 'aws-sdk'

    elb = AWS::ELB.new(
      ec2_endpoint: 'ec2.ap-northeast-1.amazonaws.com',
      elb_endpoint: 'elasticloadbalancing.ap-northeast-1.amazonaws.com'
    )
    load_balancers = elb.load_balancers

    s3 = AWS::S3.new
    buckets = s3.buckets

    hosted_zone "nicovideo.jp." do
      # Simple records by YAML
      defined_by_yaml = YAML.load_file("./sample.yml")

      defined_by_yaml.each do |record|
        rrset(record["name"], record["type"] || "A") do
          ttl(record["ttl"] || 300)
          resource_records(*record["values"])
        end
      end

      # ELB configuration by automatically
      load_balancers.each do |load_balancer|
        if load_balancer.scheme == 'internet-facing' && load_balancer.name.match(/nicovideo-jp$/)
          rrset load_balancer.name.gsub('-', '.'), 'A' do
            dns_name load_balancer.canonical_hosted_zone_name
          end
        end
      end

      # S3 configuration by automatically
      buckets.each do |bucket|
        if bucket.website? && bucket.name.match(/nicovideo.jp$/)
          rrset bucket.name, "CNAME" do
            resource_records("#{bucket.name}.s3-website-ap-northeast-1.amazonaws.com.")
          end
        end
      end
    end

どうでしょう？たった50行にも満たない DSL は見た目とは裏腹に大変便利に扱う事ができます。ELB や S3 は作れば名前から自動的に設定されるし、簡単なレコードは YAML で見やすく管理することが出来ます。

もちろん、 Failover ポリシーなどを利用した設定等はこれでは行えませんが、ここまで読んで頂ければより便利にするためのアイディアはすでにあなたの中にいくつもひらめていることでしょう。より高度な DSL を拡張して作ってもいいかもしれません。

いままで面倒だった DNS のレコード管理は、すでにあなたのエディタの中にあるのです！

跋文: コードにすると、おもちゃになる
------------------------------------

さて、今日はここまででオシマイです。AWS をコード化する、Route 53 編となってしまいましたが、いかがでしたでしょうか？

個人的に、設定やこのような管理運用はいつも悩みの種です。簡単ですぐできることであっても、なんとなくめんどくさくて後回しにしてしまったり、どれをやったか忘れてしまったり……と。その点、このようにコード化して管理することで『より良い方法はないか』『もっと便利にしよう！』といった遊びが生まれます。こうしておもちゃにすることで、面倒な管理運用タスクも、息抜きのコーディングに変化するのです。

AWS を使うことで、豊富なクラウドリソースが扱えるようになりましたが、本当の恩恵は実はこういったシステマティックなコード化や API 経由の操作による手作業の占める範囲を減らしてゆくことにこそあるのではないでしょうか？

あなたもぜひ、AWS をおもちゃにして遊んでみてください！
