package io.flomesh.datasync;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;

@ApplicationScoped
@Named("LoopCounter")
@RegisterForReflection(fields = false)
public class LoopCounter implements Processor {

  public void process(Exchange exchange) throws Exception {
    int total = exchange.getIn().getHeader("total", Integer.class).intValue();
    int batch = Integer.parseInt(exchange.getContext().resolvePropertyPlaceholders("{{batch.size}}"));
    int count = total / batch;
    if (total % batch > 0)
      count = count + 1;
    exchange.getIn().setHeader("loops", count);
  }
}
