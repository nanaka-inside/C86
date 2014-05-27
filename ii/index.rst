
*****
chap1
*****

Immutable Infrastructureの最適解を探る
==========================================

出発点とオチ（あとで消す
-------------------------
* この章はいわゆる格子です
* Immutable Infrastructure って言うけど、どうなの最近
  * Immutable Infrastructureとは？
* chefつらぽよなエンジニアが増えている話をきいたりしてつらぽよ
  * どのへんつらぽよ？
* 業務で本当に使えてる？
  * 結局どうなるのよ、自動化して。恩恵はあるの？
* serfとかdokkerとかansibleとかいうけど実際使えてる？
* それじゃあそれぞれ解説しましょうか
  * と思ったけどテスト大事だよね！serverspecのお話からやっていく
    * それから、chefやansibleをプラがブルに使っていく話
  * chefつらぽよ。chefについてはvol.4でやったのでそっちを参照
  * ansibleどう？
    * 使い方を解説
  * Vagrantとか使ったことないけど実際どうなの？どういう環境で動作するの？どの辺がうれしい？
  * hostsの書き換えどうしてる？
  * 監視ツールに自動で突っ込んでほしいよねー
  * CI as a Serviceが現段階でのゴールのような気がする
    * 自動化最高！ヒャッハー!!
    * IT全般籐製（ウッ頭が
* 業務に応じた感じでもろもろの技術をチョイスして組み合わせて使えるといいよね！（（結論
  * 多分このへんが無難な結論だと思う

Immutable Infrastructure とは
-----------------------------

* バズワードになってますよね
* どういう概念？
* 歴史(浅い)

とりまく技術
--------------------

* 概念
 * II
 * blue-green
 * disposable
 * orchestration

* 技術
 * chef
 * ansible
 * AWS
 * docker
 * vagrant
 * fluentd
 * Serf
 * serverspec
 * mackerel.io

一方我々は...
--------------------

