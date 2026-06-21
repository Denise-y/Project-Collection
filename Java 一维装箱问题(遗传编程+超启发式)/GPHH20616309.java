import java.io.*;
import java.util.*;

public class GPHH20616309 {
    static Random rand = new Random(42);
    static GPTree gp = new GPTree();
    public static List<GPTree.Node> top10BestTrees = new ArrayList<>();

    static int POP_SIZE = 500;      
    static int GENERATIONS = 20;    
    static int TOURNAMENT_SIZE = 7;
    static double CROSS_RATE = 0.75; 
    static double REPRO_RATE = 0.15; 
    static double MUT_RATE = 0.10;  
    static final int MEMORY_CAP = 100;

    static Map<String, Integer> globalFitnessCache = new HashMap<>();

    // ========== 循环缓冲区记忆 ==========
    static class CircularMemory {
        int[] buffer = new int[MEMORY_CAP];
        int size = 0, head = 0;
        double min = 0, max = 0, avg = 0;
        int[] freq = new int[101];

        void add(int value) {
            buffer[head] = value;
            head = (head + 1) % MEMORY_CAP;
            if (size < MEMORY_CAP) size++;
        }

        void updateStats(int newValue) {
            add(newValue);
            if (size == 0) { min = max = avg = 0; return; }
            min = Double.MAX_VALUE; max = 0;
            long sum = 0;
            Arrays.fill(freq, 0);
            if (size < MEMORY_CAP) {
                for (int i = 0; i < size; i++) {
                    int v = buffer[i];
                    if (v < min) min = v;
                    if (v > max) max = v;
                    sum += v; if (v <= 100) freq[v]++;
                }
            } else {
                for (int i = head; i < MEMORY_CAP; i++) {
                    int v = buffer[i];
                    if (v < min) min = v;
                    if (v > max) max = v;
                    sum += v; if (v <= 100) freq[v]++;
                }
                for (int i = 0; i < head; i++) {
                    int v = buffer[i];
                    if (v < min) min = v;
                    if (v > max) max = v;
                    sum += v; if (v <= 100) freq[v]++;
                }
            }
            avg = sum / (double) size;
        }

        double getFitRatio(int space) {
            if (size == 0 || space <= 0) return 0;
            int cnt = 0, limit = Math.min(space, 100);
            for (int i = 1; i <= limit; i++) cnt += freq[i];
            return (double) cnt / size;
        }

        double getAlmostFitRatio(int space) {
            if (size == 0 || space <= 0) return 0;
            int cnt = 0, lo = Math.max(1, space - 3), hi = Math.min(space, 100);
            for (int i = lo; i <= hi; i++) cnt += freq[i];
            return (double) cnt / size;
        }
    }

    // 评估一棵树 = 装箱看用多少箱子
    static int evaluate(GPTree.Node tree, List<Item> items) {
        return packWithTree(tree, items).size();
    }

    // 用树打分装箱
    static List<Bin> packWithTree(GPTree.Node tree, List<Item> allItems) {
        List<Bin> bins = new ArrayList<>();
        CircularMemory mem = new CircularMemory();

        for (Item item : allItems) {
            int S = item.size;
            mem.updateStats(S);

            Bin bestBin = null;
            double bestScore = -1e9;

            for (Bin b : bins) {
                if (!b.canAdd(item)) continue;
                int E = b.getRemaining();
                int L = E - S;

                double score = gp.eval(tree, S, E, L, mem.min, mem.max, mem.avg,
                    mem.getFitRatio(E), mem.getFitRatio(L),
                    mem.getAlmostFitRatio(E), mem.getAlmostFitRatio(L),
                    mem.getFitRatio(E));

                if (score > bestScore) {
                    bestScore = score;
                    bestBin = b;
                }
            }

            if (bestBin != null) bestBin.add(item);
            else { Bin nb = new Bin(item); bins.add(nb); }
        }
        return bins;
    }

    static int globalFitness(GPTree.Node tree, List<List<Item>> allInstances) {
        int total = 0;
        for (List<Item> items : allInstances) {
            total += evaluate(tree, items);
        }
        return total;
    }

    // 用树字符串做key，实现跨代复用
    static String treeKey(GPTree.Node tree) {
        StringBuilder sb = new StringBuilder();
        buildTreeKey(tree, sb);
        return sb.toString();
    }

    static void buildTreeKey(GPTree.Node n, StringBuilder sb) {
        if (n == null) return;
        if (n.isOp) sb.append("(");
        buildTreeKey(n.left, sb);
        sb.append(n.value);
        buildTreeKey(n.right, sb);
        if (n.isOp) sb.append(")");
    }

    // 锦标赛选择
    static GPTree.Node select(List<GPTree.Node> pop, Map<GPTree.Node, Integer> fitnessCache) {
        GPTree.Node best = pop.get(rand.nextInt(pop.size()));
        int bestFit = fitnessCache.get(best);
        for (int i = 1; i < TOURNAMENT_SIZE; i++) {
            GPTree.Node curr = pop.get(rand.nextInt(pop.size()));
            int currFit = fitnessCache.get(curr);
            if (currFit < bestFit) { best = curr; bestFit = currFit; }
        }
        return best;
    }

    static List<Item> loadItems(String file) throws Exception {
        List<Item> items = new ArrayList<>();
        Scanner sc = new Scanner(new File(file));
        int idx = 0;
        while (sc.hasNextInt()) items.add(new Item(sc.nextInt(), idx++));
        sc.close();
        return items;
    }

    static List<GPTree.Node> loadTop10Trees(String filename) throws Exception {
        List<GPTree.Node> trees = new ArrayList<>();
        File f = new File(filename);
        if (!f.exists()) {
            System.out.println("历史树文件不存在: " + filename + "，将从头开始训练");
            return trees;
        }

        BufferedReader br = new BufferedReader(new FileReader(filename));
        String line;
        int count = 0;

        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            int fitnessStart = line.indexOf("FITNESS=");
            if (fitnessStart == -1) continue;
            int fitnessEnd = line.indexOf(' ', fitnessStart);
            if (fitnessEnd == -1) fitnessEnd = line.length();
            String expr = line.substring(fitnessEnd).trim();
            try {
                GPTree.Node root = gp.parseTree(expr);
                if (root != null) {
                    trees.add(root);
                    count++;
                }
            } catch (Exception e) {
                System.out.println("解析树失败，跳过: " + e.getMessage());
            }
        }
        br.close();
        System.out.println("从 " + filename + " 加载了 " + count + " 棵历史树");
        return trees;
    }

    public static void main(String[] args) throws Exception {
        String instFile = null, outFile = null;
        int maxTime = 10; // 默认10秒

        for (int j = 0; j < args.length; j++) {
            if (args[j].equals("-s") && j + 1 < args.length) instFile = args[++j];
            if (args[j].equals("-o") && j + 1 < args.length) outFile = args[++j];
            if (args[j].equals("-t") && j + 1 < args.length) {
                try {
                    maxTime = Integer.parseInt(args[++j]);
                } catch (NumberFormatException e) {
                    System.out.println("警告: -t 参数格式错误，使用默认值10秒");
                }
            }
        }

        if (instFile != null && outFile != null) {
            runTesting(instFile, outFile, maxTime);
        } else {
            runTraining();
        }
    }

    static void runTraining() throws Exception {
        String testFolder = "train";
        String prefix = "binpack", suffix = ".txt";
        int start = 0, end = 19;

        System.out.println("========== 训练模式 ==========");
        System.out.println("训练集: " + testFolder + " (" + (end - start + 1) + " 个实例)");
        System.out.println("种群: " + POP_SIZE + ", 代数: " + GENERATIONS);
        System.out.println("精英率: " + (int)(REPRO_RATE*100) + "%, 交叉率: " + (int)(CROSS_RATE*100) + "%, 变异率: " + (int)(MUT_RATE*100) + "%");

        List<GPTree.Node> historyTrees = loadTop10Trees("top10_trees.txt");
        top10BestTrees.clear();
        top10BestTrees.addAll(historyTrees);

        System.out.println("\n预加载训练实例...");
        List<List<Item>> allInstances = new ArrayList<>();
        for (int i = start; i <= end; i++) {
            String f = testFolder + "/" + prefix + i + suffix;
            allInstances.add(loadItems(f));
            System.out.println("  加载: " + f + " (" + allInstances.get(allInstances.size()-1).size() + " items)");
        }
        System.out.println("全部 " + allInstances.size() + " 个实例加载完成\n");

        // 初始化种群
        List<GPTree.Node> pop = new ArrayList<>();
        for (GPTree.Node t : top10BestTrees) pop.add(t.copy());
        int historyCount = pop.size();
        while (pop.size() < POP_SIZE) pop.add(gp.createTree());
        System.out.println("种群: " + historyCount + " 历史 + " + (POP_SIZE - historyCount) + " 新生 = " + pop.size());

        GPTree.Node bestTree = pop.get(0);
        int bestFitness = Integer.MAX_VALUE;

        System.out.println("\n========== 开始进化 ==========");
        long totalStart = System.currentTimeMillis();

        for (int gen = 0; gen < GENERATIONS; gen++) {
            long genStart = System.currentTimeMillis();

            Map<GPTree.Node, Integer> fitnessCache = new HashMap<>();
            int newEval = 0;
            int cached = 0;

            for (GPTree.Node tree : pop) {
                String key = treeKey(tree);
                if (globalFitnessCache.containsKey(key)) {
                    fitnessCache.put(tree, globalFitnessCache.get(key));
                    cached++;
                } else {
                    int totalBins = globalFitness(tree, allInstances);
                    fitnessCache.put(tree, totalBins);
                    globalFitnessCache.put(key, totalBins);
                    newEval++;
                }
            }

            for (GPTree.Node t : pop) {
                int fit = fitnessCache.get(t);
                if (fit < bestFitness) {
                    bestFitness = fit;
                    bestTree = t;
                }
            }

            pop.sort(Comparator.comparingInt(fitnessCache::get));
            int currentBest = fitnessCache.get(pop.get(0));
            long genTime = System.currentTimeMillis() - genStart;
            System.out.printf("Gen%2d | current=%d | best=%d | new=%d | cached=%d | %dms\n",
                gen + 1, currentBest, bestFitness, newEval, cached, genTime);

            // 生成下一代
            List<GPTree.Node> newPop = new ArrayList<>();

            while (newPop.size() < POP_SIZE) {
                double r = rand.nextDouble();
                if (r < REPRO_RATE) {
                    GPTree.Node p = select(pop, fitnessCache);
                    newPop.add(p.copy());
                } else if (r < REPRO_RATE + CROSS_RATE) {
                    newPop.add(gp.crossover(select(pop, fitnessCache), select(pop, fitnessCache)));
                } else {
                    newPop.add(gp.mutate(select(pop, fitnessCache)));
                }
            }
            pop = newPop;
        }

        long totalTime = System.currentTimeMillis() - totalStart;
        System.out.printf("\n进化完成！总耗时: %.1f秒\n", totalTime / 1000.0);

        // 最终评估
        Map<GPTree.Node, Integer> finalCache = new HashMap<>();
        for (GPTree.Node t : pop) {
            String key = treeKey(t);
            if (globalFitnessCache.containsKey(key)) {
                finalCache.put(t, globalFitnessCache.get(key));
            } else {
                int f = globalFitness(t, allInstances);
                finalCache.put(t, f);
                globalFitnessCache.put(key, f);
            }
        }
        pop.sort(Comparator.comparingInt(finalCache::get));

        // 保存top10
        top10BestTrees.clear();
        System.out.println("\n========== 保存新的 Top 10 Trees ==========");
        try (PrintWriter pw = new PrintWriter("top10_trees.txt")) {
            for (int i = 0; i < 10 && i < pop.size(); i++) {
                GPTree.Node tree = pop.get(i).copy();
                top10BestTrees.add(tree);
                int f = finalCache.get(pop.get(i));
                StringBuilder sb = new StringBuilder();
                GPTree.buildTreeStr(tree, sb);
                pw.println("TREE_" + i + " FITNESS=" + f + " " + sb.toString());
                System.out.printf("#%d fitness=%d | ", i + 1, f);
                GPTree.printTree(tree);
                System.out.println();
            }
        }
        System.out.println("\n已保存到 top10_trees.txt");

        System.out.println("\n========== 最优树在训练集上的表现 ==========");
        for (int i = 0; i < allInstances.size(); i++) {
            int bins = evaluate(bestTree, allInstances.get(i));
            System.out.println("binpack" + i + ".txt: " + bins + " bins");
        }
    }

    static void runTesting(String instFile, String outFile, int maxTime) throws Exception {
        List<Item> items = loadItems(instFile);

        // 硬编码最优树 TREE_0 FITNESS=43867
        String bestTreeExpr = "((((S * ((((((((FXL * FXL )- (FXE / FXL ))/ ((FXE / FXL )* (max + FI )))+ (FXE / L ))+ ((FXL * max )* (FL + (S * FXL ))))* (((min * S )/ (FI / max ))+ ((FXE - FE )/ ((FL * FXL )* FXE ))))+ ((FXE - FE )/ ((FL * FXL )* FXE )))* (((min * S )/ (FI / max ))+ (((((FXL * FE )- (FXE * FL ))/ ((L / FL )* (max + FI )))- FE )/ (L * FXE )))))+ (FXE / L ))+ ((FXL * max )* (S * ((((((((FXL * FXL )- (FXE * FE ))/ ((FXE / FXL )* (max + FI )))+ (FXE / L ))+ ((FXL * max )* (FL + (FL / max ))))* (((min * S )/ (FI / max ))+ ((FXE - FE )/ ((FL * FXL )* FXE ))))+ ((FXE - FE )/ ((FL * FXL )* FXE )))* (((min * S )/ (FI / max ))+ (((((FXL * FE )- (FXE * FL ))/ ((L / FL )* (max + FI )))- FE )/ (L * FXE )))))))* (((min * S )/ (FI / max ))+ (FI / ((max - avg )* FXE ))))";
        GPTree.Node tree = gp.parseTree(bestTreeExpr);

        List<Bin> bins = packWithTree(tree, items);

        // 从L2 bounds文件读取
        int l2Bound = 0;
        String l2File = "l2_bounds_testdual_0_4_8_instances.csv";
        File l2f = new File(l2File);
        if (l2f.exists()) {
            l2Bound = readL2FromFile(l2File, instFile);
        }

        // 输出格式
        String name = new File(instFile).getParentFile().getName() + "_" +
                      new File(instFile).getName().replace(".txt", "");

        try (PrintWriter pw = new PrintWriter(outFile)) {
            pw.println(name);
            pw.println("obj=" + bins.size() + " " + l2Bound);
            for (Bin b : bins) {
                for (Item it : b.getItems()) pw.print(it.index + " ");
                pw.println();
            }
        }
        System.out.println("输出: " + outFile + " bins=" + bins.size() + " L2=" + l2Bound);
    }

    static int readL2FromFile(String csvFile, String instFile) {
        try {
            BufferedReader br = new BufferedReader(new FileReader(csvFile));
            br.readLine(); // skip header
            String line;
            String instName = new File(instFile).getName();
            String setName = new File(instFile).getParentFile().getName();
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length >= 3 && parts[0].trim().equals(setName) 
                    && parts[1].trim().equals(instName)) {
                    br.close();
                    return Integer.parseInt(parts[2].trim());
                }
            }
            br.close();
        } catch (Exception e) {
            // ignore, return 0
        }
        return 0;
    }
}